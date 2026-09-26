from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_connection

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


class WarehouseCreate(BaseModel):
    name: str
    location: str | None = None


@router.post("/")
def create_warehouse(warehouse: WarehouseCreate):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO warehouses (name, location)
            VALUES (%s, %s)
            RETURNING id, name, location
            """,
            (warehouse.name, warehouse.location),
        )

        result = cursor.fetchone()
        conn.commit()

        return {
            "id": result[0],
            "name": result[1],
            "location": result[2],
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def get_warehouses():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, name, location
        FROM warehouses
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
            "location": row[2],
        }
        for row in rows
    ]