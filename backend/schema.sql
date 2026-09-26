CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (warehouse_id, name)
);

CREATE TABLE stock (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, room_id)
);

CREATE TABLE receipts (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfers (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    from_room_id BIGINT NOT NULL REFERENCES rooms(id),
    to_room_id BIGINT NOT NULL REFERENCES rooms(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (from_room_id <> to_room_id)
);

CREATE TABLE adjustments (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    old_quantity INTEGER NOT NULL CHECK (old_quantity >= 0),
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    reason TEXT NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_ledger (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (
        transaction_type IN ('RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT')
    ),
    quantity_change INTEGER NOT NULL,
    reference_id BIGINT,
    performed_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_room ON stock(room_id);
CREATE INDEX idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_ledger_created_at ON stock_ledger(created_at);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);