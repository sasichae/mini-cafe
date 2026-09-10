# Plan: Mini Café Backend Development

## Overview
Build a REST API for a small coffee ordering system using Node.js, Express, MySQL (mysql2), and dotenv. Beginner-friendly code, no over-engineering.

## Project Structure
```
backend/
├── config/
│   └── db.js              # MySQL connection pool
├── controllers/
│   ├── product.controller.js  # Product CRUD logic
│   └── order.controller.js    # Order logic
├── routes/
│   ├── product.routes.js      # Product API routes
│   └── order.routes.js        # Order API routes
├── .env                  # Database config (NOT committed)
├── app.js                # Express app setup
├── server.js             # Start server
└── package.json          # Dependencies + scripts
```

## Execution Phases

### Phase 1: Project Setup
1. Clean old backend files (remove `backend/src/`, old `package.json`)
2. Create folder structure: `config/`, `controllers/`, `routes/`
3. Create `package.json` with dependencies: `express`, `mysql2`, `dotenv`
4. Run `npm install`
5. Create `.env` file with MySQL connection details

### Phase 2: Database Connection
Create `config/db.js`:
- Use `mysql2/promise` for async/await support
- Create connection pool with `.env` variables
- Export pool for use in controllers

### Phase 3: Product API
**Routes** (`routes/product.routes.js`):
- `GET /api/products` → get all products
- `GET /api/products/:id` → get product by ID
- `POST /api/products` → create product
- `PUT /api/products/:id` → update product
- `DELETE /api/products/:id` → delete product

**Controller** (`controllers/product.controller.js`):
- `getProducts()`: SELECT * FROM products
- `getProductById()`: SELECT * FROM products WHERE id = ?
- `createProduct()`: INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)
- `updateProduct()`: UPDATE products SET ... WHERE id = ?
- `deleteProduct()`: DELETE FROM products WHERE id = ?

**Validation rules**:
- `name`: required, not empty
- `price`: required, must be > 0
- Return 400 for invalid data, 404 for not found

### Phase 4: Order API
**Routes** (`routes/order.routes.js`):
- `POST /api/orders` → create order
- `GET /api/orders` → get all orders
- `GET /api/orders/:id` → get order with items

**Controller** (`controllers/order.controller.js`):
- `createOrder()`:
  1. Validate: items array must have ≥1 item
  2. Validate: each item has product_id and quantity > 0
  3. Check product exists in DB
  4. Calculate price per item (from DB, not client)
  5. Calculate total_price
  6. Use transaction: INSERT INTO orders → INSERT INTO order_items
  7. Return 201 with order details

- `getOrders()`: SELECT * FROM orders
- `getOrderById()`: SELECT * FROM orders WHERE id = ?, then JOIN with order_items + products

**Validation rules**:
- `items`: required array, min length 1
- `items[].product_id`: required, must exist in products
- `items[].quantity`: required, must be > 0
- Return 400 for invalid data, 404 for not found

### Phase 5: App & Server Setup
**`app.js`**:
- Create Express app
- Use `express.json()` middleware
- Load routes: `/api/products`, `/api/orders`
- Error handling middleware

**`server.js`**:
- Import app
- Start server on port 3000
- Log "Server running on port 3000"

### Phase 6: Testing
Test with curl or Postman:

**Products**:
```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/1
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Latte","description":"Espresso with milk","price":120,"image":"latte.jpg"}'
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Latte","price":130}'
curl -X DELETE http://localhost:3000/api/products/1
```

**Orders**:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":1,"quantity":2},{"product_id":2,"quantity":1}]}'
curl http://localhost:3000/api/orders
curl http://localhost:3000/api/orders/1
```

## Implementation Rules
- Use `async/await` with `mysql2/promise`
- Use parameterized queries (`?` placeholders) to prevent SQL injection
- Return JSON responses: `{ success: true/false, data/message: ... }`
- Proper HTTP status codes: 200, 201, 400, 404, 500
- Simple error handling with try/catch
- No TypeScript, no Prisma, no Sequelize
- No authentication, no payment, no delivery
- Beginner-friendly, readable code with comments

## .env Example
```
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=mini_cafe
```

## Notes
- MySQL runs in Docker on port 3307 (mapped from container's 3306)
- Database schema already exists in phpMyAdmin
- Old backend files should be completely replaced
