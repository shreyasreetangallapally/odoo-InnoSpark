from fastapi import HTTPException, Header
from app.database import get_connection


def get_current_user(user_id: int = Header(..., alias="X-User-ID")):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, name, email, role
        FROM users
        WHERE id = %s
        """,
        (user_id,),
    )

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid user"
        )

    return {
        "id": user[0],
        "name": user[1],
        "email": user[2],
        "role": user[3],
    }


def require_role(allowed_roles: list[str]):
    def checker(user=Header(..., alias="X-User-ID")):
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, name, email, role
            FROM users
            WHERE id = %s
            """,
            (user,),
        )

        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if result is None:
            raise HTTPException(status_code=401, detail="Invalid user")

        if result[3] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )

        return {
            "id": result[0],
            "name": result[1],
            "email": result[2],
            "role": result[3],
        }

    return checker