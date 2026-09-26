# Odoo InnoSpark — Database Schema

## Database

PostgreSQL

Database name:

`odoo_innospark`

## Core Tables

### 1. users

Stores application users and their roles.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Allowed roles:

- OWNER
- MANAGER
- EMPLOYEE

---

### 2. products

Stores products managed by the inventory system.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| name | VARCHAR(150) | NOT NULL |
| sku | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | NULL |
| unit | VARCHAR(50) | NOT NULL |
| reorder_level | INTEGER | NOT NULL, >= 0 |
| created_at | TIMESTAMP | NOT NULL |

---

### 3. warehouses

Stores warehouses.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| name | VARCHAR(150) | NOT NULL |
| location | VARCHAR(255) | NULL |
| created_at | TIMESTAMP | NOT NULL |

---

### 4. rooms

Stores rooms/locations inside warehouses.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| warehouse_id | BIGINT | Foreign Key → warehouses.id |
| name | VARCHAR(100) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

---

### 5. stock

Stores the current quantity of each product in each room.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| product_id | BIGINT | Foreign Key → products.id |
| room_id | BIGINT | Foreign Key → rooms.id |
| quantity | INTEGER | NOT NULL, >= 0 |
| updated_at | TIMESTAMP | NOT NULL |

Constraint:

`UNIQUE(product_id, room_id)`

This table is the source of truth for current stock.

---

### 6. receipts

Records incoming stock transactions.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| product_id | BIGINT | Foreign Key → products.id |
| room_id | BIGINT | Foreign Key → rooms.id |
| quantity | INTEGER | NOT NULL, > 0 |
| created_by | BIGINT | Foreign Key → users.id |
| created_at | TIMESTAMP | NOT NULL |

---

### 7. deliveries

Records outgoing stock transactions.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| product_id | BIGINT | Foreign Key → products.id |
| room_id | BIGINT | Foreign Key → rooms.id |
| quantity | INTEGER | NOT NULL, > 0 |
| created_by | BIGINT | Foreign Key → users.id |
| created_at | TIMESTAMP | NOT NULL |

---

### 8. transfers

Records stock movement between rooms.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| product_id | BIGINT | Foreign Key → products.id |
| from_room_id | BIGINT | Foreign Key → rooms.id |
| to_room_id | BIGINT | Foreign Key → rooms.id |
| quantity | INTEGER | NOT NULL, > 0 |
| created_by | BIGINT | Foreign Key → users.id |
| created_at | TIMESTAMP | NOT NULL |

Constraint:

`from_room_id != to_room_id`

Transfers must be atomic.

---

### 9. adjustments

Records manual stock corrections.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| product_id | BIGINT | Foreign Key → products.id |
| room_id | BIGINT | Foreign Key → rooms.id |
| old_quantity | INTEGER | NOT NULL, >= 0 |
| new_quantity | INTEGER | NOT NULL, >= 0 |
| reason | TEXT | NOT NULL |
| created_by | BIGINT | Foreign Key → users.id |
| created_at | TIMESTAMP | NOT NULL |

---

### 10. stock_ledger

Stores the history of every successful stock movement.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| product_id | BIGINT | Foreign Key → products.id |
| room_id | BIGINT | Foreign Key → rooms.id |
| transaction_type | VARCHAR(20) | NOT NULL |
| quantity_change | INTEGER | NOT NULL |
| reference_id | BIGINT | NULL |
| performed_by | BIGINT | Foreign Key → users.id |
| created_at | TIMESTAMP | NOT NULL |

Allowed transaction types:

- RECEIPT
- DELIVERY
- TRANSFER
- ADJUSTMENT

The ledger is historical and must not be used as the current-stock source of truth.

---

### 11. audit_logs

Stores who performed write operations and when.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary Key |
| user_id | BIGINT | Foreign Key → users.id |
| action | VARCHAR(100) | NOT NULL |
| entity_type | VARCHAR(50) | NOT NULL |
| entity_id | BIGINT | NULL |
| details | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |

---

# Relationships

```text
warehouses
    |
    └── rooms
          |
          └── stock
                |
                └── products

users
    |
    ├── receipts
    ├── deliveries
    ├── transfers
    ├── adjustments
    ├── stock_ledger
    └── audit_logs