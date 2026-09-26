from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_connection

router = APIRouter(prefix="/products", tags=["Products"])


class ProductCreate(BaseModel):
    name: str
    sku: str
    description: str | None = None
    unit: str
    reorder_level: int = 0


@router.post("/")
def create_product(product: ProductCreate):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO products
            (name, sku, description, unit, reorder_level)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, sku, description, unit, reorder_level
            """,
            (
                product.name,
                product.sku,
                product.description,
                product.unit,
                product.reorder_level,
            ),
        )

        result = cursor.fetchone()
        conn.commit()

        return {
            "id": result[0],
            "name": result[1],
            "sku": result[2],
            "description": result[3],
            "unit": result[4],
            "reorder_level": result[5],
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def get_products():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, name, sku, description, unit, reorder_level
        FROM products
        ORDER BY id
        """
    )

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return [
        {
            "id": row[0],
            "name": row[1],
            "sku": row[2],
            "description": row[3],
            "unit": row[4],
            "reorder_level": row[5],
        }
        for row in rows
    ]
@router.get("/{product_id}")
def get_product(product_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, name, sku, description, unit, reorder_level
        FROM products
        WHERE id = %s
        """,
        (product_id,)
    )

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": row[0],
        "name": row[1],
        "sku": row[2],
        "description": row[3],
        "unit": row[4],
        "reorder_level": row[5],
    }