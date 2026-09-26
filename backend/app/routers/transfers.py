from fastapi import APIRouter, HTTPException, Depends
from app.auth.security import get_current_user
from pydantic import BaseModel
from app.database import get_connection
from app.services.stock_engine import change_stock

router = APIRouter(prefix="/transfers", tags=["Transfers"])


class TransferCreate(BaseModel):
    product_id: int
    from_room_id: int
    to_room_id: int
    quantity: int


@router.post("/")
def create_transfer(
    transfer: TransferCreate,
    user=Depends(get_current_user)
):
    if transfer.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    if transfer.from_room_id == transfer.to_room_id:
        raise HTTPException(
            status_code=400,
            detail="Source and destination rooms must be different"
        )

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO transfers
            (product_id, from_room_id, to_room_id, quantity, created_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                transfer.product_id,
                transfer.from_room_id,
                transfer.to_room_id,
                transfer.quantity,
                user["id"],
            ),
        )

        transfer_id = cursor.fetchone()[0]

        source_stock = change_stock(
            cursor=cursor,
            product_id=transfer.product_id,
            room_id=transfer.from_room_id,
            quantity_change=-transfer.quantity,
            transaction_type="TRANSFER",
            performed_by=user["id"],
            reference_id=transfer_id,
        )

        destination_stock = change_stock(
            cursor=cursor,
            product_id=transfer.product_id,
            room_id=transfer.to_room_id,
            quantity_change=transfer.quantity,
            transaction_type="TRANSFER",
            performed_by=user["id"],
            reference_id=transfer_id,
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
                "TRANSFER",
                transfer_id,
                f"Transferred {transfer.quantity} units of product {transfer.product_id} from room {transfer.from_room_id} to room {transfer.to_room_id}",
            ),
        )

        conn.commit()

        return {
            "transfer_id": transfer_id,
            "source_stock": source_stock,
            "destination_stock": destination_stock,
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