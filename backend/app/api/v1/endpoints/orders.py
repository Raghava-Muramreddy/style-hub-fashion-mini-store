from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.order import OrderRead
from app.services.order_service import get_order, list_orders

router = APIRouter(prefix="/orders")


@router.get("", response_model=list[OrderRead])
def list_user_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> list:
    return list_orders(db, current_user.id)


@router.get("/{order_id}", response_model=OrderRead)
def get_order_detail(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> object:
    order = get_order(db, current_user.id, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order
