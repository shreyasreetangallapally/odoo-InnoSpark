from data.mock_data import employees, rooms


def check_access(employee_id, room_id):
    if employee_id not in employees:
        return "Employee not found"

    employee = employees[employee_id]

    if employee["room_id"] == room_id:
        return f"ACCESS ALLOWED: {employee['name']} can access {rooms[room_id]}"

    return f"ACCESS DENIED: {employee['name']} cannot access {rooms[room_id]}"