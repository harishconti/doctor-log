from fastapi import APIRouter, Request, Response, status
import logging

router = APIRouter()

@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request):
    """
    Basic webhook endpoint for Stripe.
    In a real application, this would handle events from Stripe.
    """
    payload = await request.body()
    # For now, we'll just log the payload and headers.
    # In a real app, you would verify the signature and process the event.
    logging.info(f"Received Stripe webhook with headers: {request.headers}")
    logging.info(f"Webhook payload: {payload.decode('utf-8')}")

    return Response(status_code=status.HTTP_200_OK)