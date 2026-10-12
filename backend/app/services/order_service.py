from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem


def list_orders(db: Session, user_id: int) -> list[Order]:
    return db.scalars(select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())).all()


def get_order(db: Session, user_id: int, order_id: int) -> Order | None:
    return db.scalar(select(Order).where(Order.user_id == user_id, Order.id == order_id))


def get_order_items(db: Session, order_id: int) -> list[OrderItem]:
    return db.scalars(select(OrderItem).where(OrderItem.order_id == order_id)).all()
