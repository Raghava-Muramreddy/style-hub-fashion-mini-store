from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine
from app.models.cart import Cart  # noqa: F401
from app.models.cart_item import CartItem  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.order_item import OrderItem  # noqa: F401
from app.models.product import Product
from app.models.user import User  # noqa: F401
from app.seed.fashion_catalog import CURRENCY, PRICES_INR, PRODUCTS


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def convert_legacy_usd_products(session: Session) -> None:
    """Move catalog products seeded in USD to INR prices (existing orders keep their own currency)."""
    for product in session.scalars(select(Product).where(Product.currency == "usd")).all():
        rupees = PRICES_INR.get(product.name)
        if rupees is not None:
            product.price = rupees * 100
        else:
            product.price = round(product.price * 83 / 10000) * 100
        product.currency = CURRENCY
    session.commit()


def seed_products() -> None:
    with Session(engine) as session:
        existing_count = session.scalar(select(Product.id).limit(1))
        if existing_count is not None:
            convert_legacy_usd_products(session)
            return
        for item in PRODUCTS:
            session.add(Product(**item, is_active=True))
        session.commit()
