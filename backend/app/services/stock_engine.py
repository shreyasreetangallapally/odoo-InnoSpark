from fastapi import HTTPException
from app.database import get_connection


def change_stock(
    cursor,
    product_id: int,
    room_id: int,
    quantity_change: int,
    transaction_type: str,
    performed_by: int,
    reference_id: int | None = None,
):
    cursor.execute(
        """
        SELECT id, quantity
        FROM stock
        WHERE product_id = %s AND room_id = %s
        FOR UPDATE
        """,
        (product_id, room_id),
    )

    stock = cursor.fetchone()

    if stock is None:
        if quantity_change < 0:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock",
            )

        cursor.execute(
            """
            INSERT INTO stock (product_id, room_id, quantity)
            VALUES (%s, %s, %s)
            RETURNING id, quantity
            """,
            (product_id, room_id, quantity_change),
        )

        stock_id, new_quantity = cursor.fetchone()

    else:
        stock_id, current_quantity = stock
        new_quantity = current_quantity + quantity_change

        if new_quantity < 0:
            raise HTTPException(
                status_code=400,
                detail="Insufficient stock",
            )

        cursor.execute(
            """
            UPDATE stock
            SET quantity = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (new_quantity, stock_id),
        )

    cursor.execute(
        """
        INSERT INTO stock_ledger
        (
            product_id,
            room_id,
            transaction_type,
            quantity_change,
            reference_id,
            performed_by
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            product_id,
            room_id,
            transaction_type,
            quantity_change,
            reference_id,
            performed_by,
        ),
    )

    return {
        "product_id": product_id,
        "room_id": room_id,
        "quantity": new_quantity,
    }