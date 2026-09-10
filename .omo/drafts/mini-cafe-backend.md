# Draft: Mini Café Backend Development

## Requirements (confirmed)
- REST API for small coffee shop system
- Products CRUD (Create, Read, Update, Delete)
- Orders (Create, Read with items)
- MySQL database with mysql2
- Express.js backend
- No authentication/payment/delivery needed
- Simple, beginner-friendly code

## Technical Decisions
- **Database**: MySQL 8.0 (Docker)
- **ORM**: None - use raw mysql2 queries
- **Validation**: Manual validation in controllers
- **Error handling**: HTTP status codes (200, 201, 400, 404, 500)

## Current Project State
- Backend exists with minimal structure (server.js, product routes)
- Database init.sql exists with basic schema (products, orders, order_items)
- Frontend is empty scaffold
- Docker Compose configured for MySQL + phpMyAdmin

## Open Questions
- Should we refactor existing backend code or build from scratch?
- How to handle database connection pooling?
- Where to put validation logic?

## Scope Boundaries
- INCLUDE: Backend API only (products + orders)
- INCLUDE: Database design and connection
- INCLUDE: Basic validation
- EXCLUDE: Frontend implementation
- EXCLUDE: Authentication/login
- EXCLUDE: Payment processing
- EXCLUDE: Delivery system

## Step 1: System Analysis & Database Design

### System Overview
The Mini Café Backend is a REST API that manages:
1. **Products** - Coffee menu items with CRUD operations
2. **Orders** - Customer orders with multiple items

### Data Flow
```
Client → Express API → MySQL Database
         ↓
    Controllers (business logic)
         ↓
    Database queries (mysql2)
```

### Database Schema Design

#### Table: `products`
Stores coffee menu items.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Product name |
| description | TEXT | NULL | Product description |
| price | DECIMAL(10,2) | NOT NULL | Product price |
| image | VARCHAR(255) | NULL | Image URL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

#### Table: `orders`
Stores customer orders.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| total_price | DECIMAL(10,2) | NOT NULL | Total order price |
| status | VARCHAR(30) | DEFAULT 'pending' | Order status |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

#### Table: `order_items`
Stores individual items in an order.

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| order_id | INT | FOREIGN KEY → orders(id) | Parent order |
| product_id | INT | FOREIGN KEY → products(id) | Product reference |
| quantity | INT | NOT NULL | Item quantity |
| price | DECIMAL(10,2) | NOT NULL | Price at time of order |

### Relationships
```
orders (1) ──< order_items (many)
products (1) ──< order_items (many)
```

- One order can have many items
- One product can appear in many orders
- order_items links orders and products (junction table)

### API Endpoints Summary

#### Products
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/products | Get all products | 200 |
| GET | /api/products/:id | Get product by ID | 200 / 404 |
| POST | /api/products | Create product | 201 / 400 |
| PUT | /api/products/:id | Update product | 200 / 400 / 404 |
| DELETE | /api/products/:id | Delete product | 200 / 404 |

#### Orders
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | /api/orders | Create order | 201 / 400 |
| GET | /api/orders | Get all orders | 200 |
| GET | /api/orders/:id | Get order with items | 200 / 404 |

### Validation Rules

#### Products
- `name`: Required, cannot be empty
- `price`: Required, must be > 0
- `description`: Optional
- `image`: Optional

#### Orders
- `items`: Required, must be array with at least 1 item
- `items[].product_id`: Required, must exist in products table
- `items[].quantity`: Required, must be > 0
- Price is fetched from database, not from client

### Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### Success Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

## Next Steps (after confirmation)
- Step 2: Create project structure and install dependencies
- Step 3: Set up Express and database connection
- Step 4: Create Product API
- Step 5: Test Product API
- Step 6: Create Order API
- Step 7: Test Order API
- Step 8: Summary and run instructions
