from fastapi import APIRouter
from app.database import get_connection

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/")
def get_stock():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            stock.id,
            stock.product_id,
            products.name AS product_name,
            products.sku,
            stock.room_id,
            rooms.name AS room_name,
            stock.quantity,
            stock.updated_at
        FROM stock
        JOIN products ON products.id = stock.product_id
        JOIN rooms ON rooms.id = stock.room_id
        ORDER BY stock.id
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
            "sku": row[3],
            "room_id": row[4],
            "room_name": row[5],
            "quantity": row[6],
            "updated_at": row[7],
        }
        for row in rows
    ]