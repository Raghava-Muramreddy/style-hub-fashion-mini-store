from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product


def list_products(db: Session, page: int, page_size: int, category: str | None, q: str | None) -> tuple[list[Product], int]:
    query = select(Product).where(Product.is_active.is_(True))
    if category:
        query = query.where(Product.category.ilike(category))
    if q:
        query = query.where(Product.name.ilike(f"%{q}%"))
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(query.order_by(Product.id).offset((page - 1) * page_size).limit(page_size)).all()
    return items, total or 0


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)
