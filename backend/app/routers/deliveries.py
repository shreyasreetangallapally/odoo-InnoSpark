from fastapi import APIRouter, HTTPException, Depends
from app.auth.security import get_current_user
from pydantic import BaseModel
from app.database import get_connection
from app.services.stock_engine import change_stock

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


class DeliveryCreate(BaseModel):
    product_id: int
    room_id: int
    quantity: int


@router.post("/")
def create_delivery(
    delivery: DeliveryCreate,
    user=Depends(get_current_user)
):
    if delivery.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO deliveries
            (product_id, room_id, quantity, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (
                delivery.product_id,
                delivery.room_id,
                delivery.quantity,
                user["id"],
            ),
        )

        delivery_id = cursor.fetchone()[0]

        stock_result = change_stock(
            cursor=cursor,
            product_id=delivery.product_id,
            room_id=delivery.room_id,
            quantity_change=-delivery.quantity,
            transaction_type="DELIVERY",
            performed_by=user["id"],
            reference_id=delivery_id,
        )

        cursor.execute(
            """
            INSERT INTO audit_logs
            (user_id, action, entity_type, entity_id, details)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user["id"],
                "CREATE",
                "DELIVERY",
                delivery_id,
                f"Delivered {delivery.quantity} units of product {delivery.product_id} from room {delivery.room_id}",
            ),
        )

        conn.commit()

        return {
            "delivery_id": delivery_id,
            "stock": stock_result,
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cursor.close()
        conn.close()