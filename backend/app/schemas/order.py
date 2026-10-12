from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrderItemRead(BaseModel):
    id: int
    product_id: int | None
    product_name_snapshot: str
    unit_price: int
    quantity: int
    line_total: int
    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    order_number: str
    status: str
    payment_status: str
    subtotal: int
    total_amount: int
    currency: str
    stripe_payment_intent_id: str | None = None
    created_at: datetime | None = None
    paid_at: datetime | None = None
    items: list[OrderItemRead] = []
    model_config = ConfigDict(from_attributes=True)


class CheckoutResponse(BaseModel):
    order_id: int
    order_number: str
    amount: int
    currency: str
    session_id: str
    checkout_url: str
    payment_intent_id: str | None = None
    client_secret: str | None = None
