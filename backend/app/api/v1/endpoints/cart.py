from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemRead, CartItemRequest, CartItemUpdate, CartRead
from app.services.cart_service import add_item, clear_cart, delete_item, get_or_create_cart, update_item

router = APIRouter(prefix="/cart")


@router.get("", response_model=CartRead)
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> dict[str, object]:
    cart = get_or_create_cart(db, current_user.id)
    items = db.scalars(select(CartItem).where(CartItem.cart_id == cart.id)).all()
    subtotal = 0
    detail_items = []
    for item in items:
        product = db.get(Product, item.product_id)
        if product is None:
            continue
        line_total = product.price * item.quantity
        subtotal += line_total
        detail_items.append({
            "id": item.id,
            "product_id": product.id,
            "quantity": item.quantity,
            "product_name": product.name,
            "unit_price": product.price,
            "line_total": line_total,
        })
    return {"id": cart.id, "items": detail_items, "subtotal": subtotal, "currency": "inr", "item_count": sum(item["quantity"] for item in detail_items)}


@router.post("/items", response_model=CartItemRead, status_code=status.HTTP_201_CREATED)
def add_cart_item(payload: CartItemRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> CartItem:
    try:
        return add_item(db, current_user.id, payload.product_id, payload.quantity)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/items/{item_id}", response_model=CartItemRead)
def update_cart_item(item_id: int, payload: CartItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> CartItem:
    try:
        return update_item(db, current_user.id, item_id, payload.quantity)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def remove_cart_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Response:
    try:
        delete_item(db, current_user.id, item_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def empty_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Response:
    clear_cart(db, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
