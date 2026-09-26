from fastapi import APIRouter, HTTPException, Depends
from app.auth.security import get_current_user
from pydantic import BaseModel
from app.database import get_connection
from app.services.stock_engine import change_stock

router = APIRouter(prefix="/receipts", tags=["Receipts"])


class ReceiptCreate(BaseModel):
    product_id: int
    room_id: int
    quantity: int


@router.post("/")
def create_receipt(
    receipt: ReceiptCreate,
    user=Depends(get_current_user)
):
    if receipt.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Create receipt record
        cursor.execute(
            """
            INSERT INTO receipts
            (product_id, room_id, quantity, created_by)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (
                receipt.product_id,
                receipt.room_id,
                receipt.quantity,
                user["id"],
            ),
        )

        receipt_id = cursor.fetchone()[0]

        # Update stock + ledger using SAME transaction
        stock_result = change_stock(
            cursor=cursor,
            product_id=receipt.product_id,
            room_id=receipt.room_id,
            quantity_change=receipt.quantity,
            transaction_type="RECEIPT",
            performed_by=user["id"],
            reference_id=receipt_id,
        )

        # Audit log
        cursor.execute(
            """
            INSERT INTO audit_logs
            (user_id, action, entity_type, entity_id, details)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user["id"],
                "CREATE",
                "RECEIPT",
                receipt_id,
                f"Received {receipt.quantity} units of product {receipt.product_id} into room {receipt.room_id}",
            ),
        )

        conn.commit()

        return {
            "receipt_id": receipt_id,
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