from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.order import Order
from app.models.user import User
from app.services.payment_service import get_checkout_session, handle_webhook_event, sync_order_with_session

router = APIRouter(prefix="/payments")


@router.get("/{session_id}/status")
def payment_status(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> dict[str, object]:
    order = db.scalar(select(Order).where(Order.stripe_payment_intent_id == session_id))
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if order.payment_status != "succeeded":
        order = sync_order_with_session(db, order, get_checkout_session(session_id))
    return {"order_id": order.id, "payment_status": order.payment_status, "status": order.status}


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(default=None), db: Session = Depends(get_db)) -> dict[str, str]:
    handle_webhook_event(db, await request.body(), stripe_signature)
    return {"received": "true"}
