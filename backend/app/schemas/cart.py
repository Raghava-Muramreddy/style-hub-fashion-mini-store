from pydantic import BaseModel, ConfigDict, Field


class CartItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    product_name: str | None = None
    unit_price: int | None = None
    line_total: int | None = None
    model_config = ConfigDict(from_attributes=True)


class CartRead(BaseModel):
    id: int
    items: list[CartItemRead]
    subtotal: int
    currency: str
    item_count: int
    model_config = ConfigDict(from_attributes=True)
