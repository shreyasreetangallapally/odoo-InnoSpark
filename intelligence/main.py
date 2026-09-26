from access.access_control import check_access
from approval.approval import create_request, approve_request
from risk.stock_risk import check_stock_risk
from anomaly.anomaly_detection import detect_anomaly


# MODULE 1: ROOM ACCESS
print("=== ROOM ACCESS ===")
print(check_access(101, 1))
print(check_access(101, 2))


# MODULE 2: MANAGER APPROVAL
print("\n=== MANAGER APPROVAL ===")

request_id = create_request(
    employee_id=101,
    product="Steel",
    current_stock=100,
    requested_stock=70,
    reason="Damaged material"
)

print("Request ID:", request_id)
print("Status: PENDING")
print(approve_request(request_id))


# MODULE 3: STOCK-OUT RISK
print("\n=== STOCK-OUT RISK ===")

print(check_stock_risk(
    product="Steel",
    current_stock=30,
    average_usage=15,
    pending_orders=10
))

print()

print(check_stock_risk(
    product="Copper",
    current_stock=100,
    average_usage=10,
    pending_orders=5
))


# MODULE 4: ANOMALY DETECTION
print("\n=== ANOMALY DETECTION ===")

print(detect_anomaly(
    product="Steel",
    stock_change=-150,
    average_change=20
))

print()

print(detect_anomaly(
    product="Copper",
    stock_change=-15,
    average_change=20
))