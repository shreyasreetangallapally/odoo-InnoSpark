requests = {}


def create_request(employee_id, product, current_stock, requested_stock, reason):
    request_id = len(requests) + 1

    requests[request_id] = {
        "employee_id": employee_id,
        "product": product,
        "current_stock": current_stock,
        "requested_stock": requested_stock,
        "reason": reason,
        "status": "PENDING"
    }

    return request_id


def approve_request(request_id):
    if request_id not in requests:
        return "Request not found"

    requests[request_id]["status"] = "APPROVED"
    return "Request approved"


def reject_request(request_id):
    if request_id not in requests:
        return "Request not found"

    requests[request_id]["status"] = "REJECTED"
    return "Request rejected"