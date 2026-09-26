from fastapi import FastAPI, Depends
from fastapi import FastAPI
from app.routers.products import router as products_router
from app.routers.warehouses import router as warehouses_router
from app.routers.rooms import router as rooms_router
from app.routers.receipts import router as receipts_router
from app.routers.deliveries import router as deliveries_router
from app.routers.transfers import router as transfers_router
from app.routers.adjustments import router as adjustments_router
from app.routers.stock import router as stock_router
from app.auth.security import get_current_user
from app.routers import ledger
from app.routers.intelligence import router as intelligence_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Odoo InnoSpark API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(products_router)
app.include_router(intelligence_router)
app.include_router(warehouses_router)
app.include_router(rooms_router)
app.include_router(receipts_router)
app.include_router(deliveries_router)
app.include_router(transfers_router)
app.include_router(adjustments_router)
app.include_router(stock_router)
app.include_router(ledger.router)


@app.get("/")
def root():
    return {"message": "Odoo InnoSpark API is running"}
@app.get("/auth/me")
def auth_me(user=Depends(get_current_user)):
    return user