from fastapi import APIRouter

from app.api.v1.endpoints import auth, cart, checkout, orders, payments, products, users

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(products.router, tags=["products"])
router.include_router(cart.router, tags=["cart"])
router.include_router(checkout.router, tags=["checkout"])
router.include_router(payments.router, tags=["payments"])
router.include_router(orders.router, tags=["orders"])
