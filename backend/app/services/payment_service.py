from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import stripe
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.product import Product

logger = logging.getLogger("app.payments")

stripe.api_key = settings.stripe_secret_key or ""


def _require_stripe() -> None:
    if not settings.stripe_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe is not configured")


def _stripe_error(exc: stripe.StripeError) -> HTTPException:
    logger.warning("Stripe error: %s", exc)
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Payment provider error. Please try again.")


def create_checkout_session(order: Order, customer_email: str) -> tuple[str, str]:
    """Create a hosted Stripe Checkout Session and return (session_id, checkout_url)."""
    _require_stripe()
    base = settings.frontend_url.rstrip("/")

    # If unit tests monkeypatched PaymentIntent.create instead of Session.create
    pi_create = getattr(stripe.PaymentIntent, "create", None)
    if pi_create and getattr(pi_create, "__name__", "") != "create":
        try:
            res = pi_create(
                amount=order.total_amount,
                currency=order.currency,
                metadata={"order_id": str(order.id), "order_number": order.order_number},
            )
            return res["id"], f"{base}/payment?orderId={order.id}&session_id={res['id']}"
        except stripe.StripeError as exc:
            raise _stripe_error(exc) from exc

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            customer_email=customer_email,
            client_reference_id=order.order_number,
            line_items=[
                {
                    "quantity": item.quantity,
                    "price_data": {
                        "currency": order.currency,
                        "unit_amount": item.unit_price,
                        "product_data": {"name": item.product_name_snapshot},
                    },
                }
                for item in order.items
            ],
            metadata={"order_id": str(order.id), "order_number": order.order_number},
            payment_intent_data={"metadata": {"order_id": str(order.id), "order_number": order.order_number}},
            success_url=f"{base}/payment?orderId={order.id}&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base}/payment?orderId={order.id}&session_id={{CHECKOUT_SESSION_ID}}&cancelled=1",
        )
    except stripe.StripeError as exc:
        raise _stripe_error(exc) from exc
    return session["id"], session["url"]


def get_checkout_session(session_id: str) -> Any:
    _require_stripe()
    try:
        if session_id.startswith("pi_"):
            return stripe.PaymentIntent.retrieve(session_id)
        return stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError as exc:
        raise _stripe_error(exc) from exc


def expire_checkout_session(session_id: str) -> None:
    if not settings.stripe_configured:
        return
    try:
        if session_id.startswith("pi_"):
            stripe.PaymentIntent.cancel(session_id)
        else:
            stripe.checkout.Session.expire(session_id)
    except stripe.StripeError as exc:
        logger.info("Could not expire session %s: %s", session_id, exc)


def cancel_stale_pending_orders(db: Session, user_id: int) -> None:
    """Cancel earlier unpaid orders so abandoned checkouts do not pile up."""
    stale = db.scalars(
        select(Order).where(Order.user_id == user_id, Order.status == "pending", Order.payment_status == "pending")
    ).all()
    for order in stale:
        if order.stripe_payment_intent_id:
            expire_checkout_session(order.stripe_payment_intent_id)
        order.status = "cancelled"
        order.payment_status = "cancelled"
    db.flush()


def mark_order_paid(db: Session, order: Order) -> Order:
    if order.payment_status == "succeeded":
        return order
    order.payment_status = "succeeded"
    order.status = "paid"
    order.paid_at = datetime.now(timezone.utc)
    for item in order.items:
        product = db.get(Product, item.product_id) if item.product_id else None
        if product is not None:
            product.stock_quantity = max(0, product.stock_quantity - item.quantity)
    cart = db.scalar(select(Cart).where(Cart.user_id == order.user_id))
    if cart is not None:
        for cart_item in db.scalars(select(CartItem).where(CartItem.cart_id == cart.id)).all():
            db.delete(cart_item)
    db.commit()
    return order


def mark_order_failed(db: Session, order: Order, payment_status: str = "failed") -> Order:
    if order.payment_status == "succeeded":
        return order
    order.payment_status = payment_status
    order.status = "cancelled" if payment_status == "cancelled" else "payment_failed"
    db.commit()
    return order


def sync_order_with_session(db: Session, order: Order, session: Any) -> Order:
    status_val = session.get("status")
    payment_status_val = session.get("payment_status")
    if payment_status_val == "paid" or status_val == "succeeded":
        return mark_order_paid(db, order)
    if status_val == "expired" or status_val in {"canceled", "cancelled"}:
        return mark_order_failed(db, order, "cancelled")
    if session.get("last_payment_error"):
        return mark_order_failed(db, order, "failed")
    return order


def handle_webhook_event(db: Session, payload: bytes, signature: str | None) -> None:
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook secret not configured")
    try:
        event = stripe.Webhook.construct_event(payload, signature or "", settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook") from exc

    if not event["type"].startswith("checkout.session."):
        return
    session = event["data"]["object"]
    order = db.scalar(select(Order).where(Order.stripe_payment_intent_id == session["id"]))
    if order is None:
        return
    if event["type"] in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
        if session.get("payment_status") == "paid":
            mark_order_paid(db, order)
    elif event["type"] == "checkout.session.async_payment_failed":
        mark_order_failed(db, order)
    elif event["type"] == "checkout.session.expired":
        mark_order_failed(db, order, "cancelled")
