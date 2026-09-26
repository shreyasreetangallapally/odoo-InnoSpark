from fastapi import APIRouter
from app.database import get_connection

router = APIRouter(prefix="/ledger", tags=["Ledger"])


@router.get("/")
def get_ledger():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            stock_ledger.id,
            stock_ledger.product_id,
            products.name AS product_name,
            stock_ledger.room_id,
            rooms.name AS room_name,
            stock_ledger.transaction_type,
            stock_ledger.quantity_change,
            stock_ledger.reference_id,
            stock_ledger.performed_by,
            users.name AS performed_by_name,
            stock_ledger.created_at
        FROM stock_ledger
        JOIN products
            ON products.id = stock_ledger.product_id
        JOIN rooms
            ON rooms.id = stock_ledger.room_id
        JOIN users
            ON users.id = stock_ledger.performed_by
        ORDER BY stock_ledger.created_at DESC
        """
    )

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return [
        {
            "id": row[0],
            "product_id": row[1],
            "product_name": row[2],
            "room_id": row[3],
            "room_name": row[4],
            "transaction_type": row[5],
            "quantity_change": row[6],
            "reference_id": row[7],
            "performed_by": row[8],
            "performed_by_name": row[9],
            "created_at": row[10],
        }
        for row in rows
    ]