from __future__ import annotations

from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product


def create_checkout_order(db: Session, user_id: int) -> tuple[Order, list[OrderItem], str]:
    items = db.scalars(select(CartItem).join(CartItem.cart).where(CartItem.cart.has(user_id=user_id))).all()
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    order = Order(
        user_id=user_id,
        order_number=f"STH-{uuid4().hex[:12].upper()}",
        status="pending",
        payment_status="pending",
        subtotal=0,
        total_amount=0,
        currency=settings.stripe_currency,
    )
    db.add(order)
    db.flush()

    subtotal = 0
    order_items = []
    for item in items:
        product = db.get(Product, item.product_id)
        if product is None or not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product {item.product_id} is unavailable")
        if item.quantity <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid quantity for item {item.product_id}")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for {product.name}")
        line_total = product.price * item.quantity
        subtotal += line_total
        snapshot = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name_snapshot=product.name,
            unit_price=product.price,
            quantity=item.quantity,
            line_total=line_total,
        )
        order_items.append(snapshot)
        db.add(snapshot)
    order.subtotal = subtotal
    order.total_amount = subtotal
    db.commit()
    db.refresh(order)
    return order, order_items, order.order_number
