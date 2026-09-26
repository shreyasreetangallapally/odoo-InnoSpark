# Odoo-InnoSpark — Member 2 Frontend

This is a dependency-free frontend prototype for the StockSense inventory system.

## Run
Open `index.html` with VS Code Live Server, or any static HTTP server.

## Backend integration
The API base is configured at the top of `app.js`:

`const API_BASE = "http://localhost:8000";`

Planned API contract:
- `POST/GET /products`
- `GET /rooms`
- `GET /stock`
- `GET /stock/{product_id}/locations`
- `POST/GET /receipts`
- `POST/GET /deliveries`
- `POST/GET /transfers`
- `POST/GET /adjustments`
- `GET /ledger`
- `GET /ledger/{product_id}`
- `POST /auth/login`

The prototype uses demo data until the FastAPI backend is available.
