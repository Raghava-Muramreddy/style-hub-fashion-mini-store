from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product


def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.scalar(select(Cart).where(Cart.user_id == user_id))
    if cart:
        return cart
    cart = Cart(user_id=user_id)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def add_item(db: Session, user_id: int, product_id: int, quantity: int) -> CartItem:
    cart = get_or_create_cart(db, user_id)
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise ValueError("Product is unavailable")
    item_quantity = max(1, quantity)
    existing = db.scalar(select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id))
    new_quantity = item_quantity + (existing.quantity if existing else 0)
    if new_quantity > product.stock_quantity:
        raise ValueError("Insufficient stock")
    if existing:
        existing.quantity = new_quantity
        item = existing
    else:
        item = CartItem(cart_id=cart.id, product_id=product_id, quantity=new_quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_item(db: Session, user_id: int, item_id: int, quantity: int) -> CartItem:
    item = db.scalar(select(CartItem).join(Cart).where(Cart.user_id == user_id, CartItem.id == item_id))
    if item is None:
        raise ValueError("Cart item not found")
    if quantity <= 0:
        raise ValueError("Quantity must be positive")
    if item.product is None or not item.product.is_active or item.product.stock_quantity < quantity:
        raise ValueError("Insufficient stock")
    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, user_id: int, item_id: int) -> None:
    item = db.scalar(select(CartItem).join(Cart).where(Cart.user_id == user_id, CartItem.id == item_id))
    if item is None:
        raise ValueError("Cart item not found")
    db.delete(item)
    db.commit()


def clear_cart(db: Session, user_id: int) -> None:
    cart = get_or_create_cart(db, user_id)
    db.execute(delete(CartItem).where(CartItem.cart_id == cart.id))
    db.commit()
