from fastapi import APIRouter
from pydantic import BaseModel
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../intelligence")
    )
)

from access.access_control import check_access
from approval.approval import create_request, approve_request, reject_request
from risk.stock_risk import check_stock_risk
from anomaly.anomaly_detection import detect_anomaly

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


class AccessRequest(BaseModel):
    employee_id: int
    room_id: int


@router.post("/access")
def room_access(data: AccessRequest):
    return {"result": check_access(data.employee_id, data.room_id)}


class ApprovalRequest(BaseModel):
    employee_id: int
    product: str
    current_stock: int
    requested_stock: int
    reason: str


@router.post("/approval/request")
def create_approval(data: ApprovalRequest):
    request_id = create_request(
        data.employee_id,
        data.product,
        data.current_stock,
        data.requested_stock,
        data.reason
    )
    return {
        "request_id": request_id,
        "status": "PENDING"
    }


@router.post("/approval/{request_id}/approve")
def approve(request_id: int):
    return {"result": approve_request(request_id)}


@router.post("/approval/{request_id}/reject")
def reject(request_id: int):
    return {"result": reject_request(request_id)}


class RiskRequest(BaseModel):
    product: str
    current_stock: int
    average_usage: int
    pending_orders: int = 0


@router.post("/risk")
def stock_risk(data: RiskRequest):
    return {
        "result": check_stock_risk(
            data.product,
            data.current_stock,
            data.average_usage,
            data.pending_orders
        )
    }


class AnomalyRequest(BaseModel):
    product: str
    stock_change: int
    average_change: int


@router.post("/anomaly")
def anomaly(data: AnomalyRequest):
    return {
        "result": detect_anomaly(
            data.product,
            data.stock_change,
            data.average_change
        )
    }