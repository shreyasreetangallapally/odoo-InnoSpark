from fastapi import APIRouter, HTTPException, Depends
from app.auth.security import get_current_user
from pydantic import BaseModel
from app.database import get_connection
from app.services.stock_engine import change_stock

router = APIRouter(prefix="/adjustments", tags=["Adjustments"])


class AdjustmentCreate(BaseModel):
    product_id: int
    room_id: int
    new_quantity: int
    reason: str


@router.post("/")
def create_adjustment(
    adjustment: AdjustmentCreate,
    user=Depends(get_current_user)
):
    if adjustment.new_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity cannot be negative"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT quantity
            FROM stock
            WHERE product_id = %s AND room_id = %s
            FOR UPDATE
            """,
            (
                adjustment.product_id,
                adjustment.room_id,
            ),
        )

        stock = cursor.fetchone()
        old_quantity = stock[0] if stock else 0

        quantity_change = (
            adjustment.new_quantity - old_quantity
        )

        cursor.execute(
            """
            INSERT INTO adjustments
            (product_id, room_id, old_quantity, new_quantity, reason, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                adjustment.product_id,
                adjustment.room_id,
                old_quantity,
                adjustment.new_quantity,
                adjustment.reason,
                user["id"],
            ),
        )

        adjustment_id = cursor.fetchone()[0]

        stock_result = change_stock(
            cursor=cursor,
            product_id=adjustment.product_id,
            room_id=adjustment.room_id,
            quantity_change=quantity_change,
            transaction_type="ADJUSTMENT",
            performed_by=user["id"],
            reference_id=adjustment_id,
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
                "ADJUSTMENT",
                adjustment_id,
                f"Adjusted product {adjustment.product_id} in room {adjustment.room_id} from {old_quantity} to {adjustment.new_quantity}. Reason: {adjustment.reason}",
            ),
        )

        conn.commit()

        return {
            "adjustment_id": adjustment_id,
            "old_quantity": old_quantity,
            "new_quantity": adjustment.new_quantity,
            "stock": stock_result,
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    finally:
        cursor.close()
        conn.close()