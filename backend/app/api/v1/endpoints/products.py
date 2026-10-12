from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.product import Product
from app.schemas.product import ProductRead
from app.services.product_service import get_product, list_products

router = APIRouter(prefix="/products")


@router.get("", response_model=list[ProductRead])
def list_product_items(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    category: str | None = None,
    q: str | None = None,
) -> list[Product]:
    items, _ = list_products(db, page, page_size, category, q)
    return items


@router.get("/{product_id}", response_model=ProductRead)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)) -> Product:
    product = get_product(db, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
