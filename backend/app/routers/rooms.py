from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_connection

router = APIRouter(prefix="/rooms", tags=["Rooms"])


class RoomCreate(BaseModel):
    warehouse_id: int
    name: str


@router.post("/")
def create_room(room: RoomCreate):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO rooms (warehouse_id, name)
            VALUES (%s, %s)
            RETURNING id, warehouse_id, name
            """,
            (room.warehouse_id, room.name),
        )

        result = cursor.fetchone()
        conn.commit()

        return {
            "id": result[0],
            "warehouse_id": result[1],
            "name": result[2],
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def get_rooms():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, warehouse_id, name
        FROM rooms
        ORDER BY id
        """
    )

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return [
        {
            "id": row[0],
            "warehouse_id": row[1],
            "name": row[2],
        }
        for row in rows
    ]