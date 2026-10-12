from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.core.config import settings
from app.models.cart_item import CartItem
from app.models.user import User
from app.schemas.order import CheckoutResponse
from app.services.checkout_service import create_checkout_order
from app.services.payment_service import cancel_stale_pending_orders, create_checkout_session

router = APIRouter(prefix="/checkout")


@router.post("", response_model=CheckoutResponse)
def create_checkout(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> dict[str, object]:
    if not settings.stripe_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Stripe is not configured")
    items = db.scalars(select(CartItem).join(CartItem.cart).where(CartItem.cart.has(user_id=current_user.id))).all()
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")
    cancel_stale_pending_orders(db, current_user.id)
    order, _, _ = create_checkout_order(db, current_user.id)
    try:
        session_id, checkout_url = create_checkout_session(order, current_user.email)
    except HTTPException:
        order.status = "cancelled"
        order.payment_status = "failed"
        db.commit()
        raise
    order.stripe_payment_intent_id = session_id
    db.commit()
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "amount": order.total_amount,
        "currency": order.currency,
        "session_id": session_id,
        "checkout_url": checkout_url,
    }
