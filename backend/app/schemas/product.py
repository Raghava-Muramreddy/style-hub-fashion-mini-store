from pydantic import BaseModel, ConfigDict


class ProductBase(BaseModel):
    name: str
    description: str
    category: str
    image_url: str
    price: int
    currency: str = "inr"
    stock_quantity: int


class ProductRead(ProductBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)
