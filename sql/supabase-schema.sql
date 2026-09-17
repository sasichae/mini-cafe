-- Supabase PostgreSQL Schema for Mini Cafe

-- สร้างตาราง users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง categories
CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- สร้างตาราง products
CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(category_id),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง orders
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง order_items
CREATE TABLE order_items (
  order_item_id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(order_id),
  product_id INT NOT NULL REFERENCES products(product_id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

-- Insert ข้อมูลตัวอย่าง

-- Users (admin/admin123, staff/staff123)
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$10$lEu9QOvClvlCAG.wMFe6v.yb7LFbSDAaDptpoy9MBqHL9w6/bqyLu', 'admin'),
  ('staff', '$2b$10$ByB5xY1Slxy0O08kTG/jMuNAkCMdF1vym4J4WIyqh4y37fSY0dVjm', 'staff');

-- Categories
INSERT INTO categories (name) VALUES
  ('Coffee'),
  ('Tea'),
  ('Non-Coffee'),
  ('Bakery'),
  ('Ice Cream');

-- Products
INSERT INTO products (category_id, name, price, description, image, is_available) VALUES
  (1, 'Espresso', 80.00, 'Strong black coffee', '/images/espresso.svg', TRUE),
  (1, 'Latte', 95.00, 'Coffee with steamed milk', '/images/latte.svg', TRUE),
  (1, 'Cappuccino', 95.00, 'Coffee with foam', '/images/cappuccino.svg', TRUE),
  (1, 'Americano', 75.00, 'Espresso with hot water', '/images/americano.svg', TRUE),
  (1, 'Mocha', 105.00, 'Coffee with chocolate', '/images/mocha.svg', TRUE),
  (2, 'Green Tea', 70.00, 'Japanese green tea', '/images/green-tea.svg', TRUE),
  (2, 'Thai Tea', 65.00, 'Sweet Thai tea', '/images/thai-tea.svg', TRUE),
  (2, 'Oolong Tea', 75.00, 'Premium oolong tea', '/images/oolong-tea.svg', TRUE),
  (2, 'Matcha Latte', 110.00, 'Matcha with steamed milk', '/images/matcha-latte.svg', TRUE),
  (3, 'Chocolate', 85.00, 'Rich chocolate drink', '/images/chocolate.svg', TRUE),
  (3, 'Matcha', 90.00, 'Matcha drink', '/images/matcha.svg', TRUE),
  (3, 'Strawberry', 80.00, 'Fresh strawberry smoothie', '/images/strawberry.svg', TRUE),
  (3, 'Mango', 85.00, 'Mango smoothie', '/images/mango.svg', TRUE),
  (3, 'Orange Juice', 70.00, 'Fresh orange juice', '/images/orange-juice.svg', TRUE),
  (4, 'Croissant', 55.00, 'Butter croissant', '/images/croissant.svg', TRUE),
  (4, 'Muffin', 45.00, 'Blueberry muffin', '/images/muffin.svg', TRUE),
  (4, 'Donut', 40.00, 'Glazed donut', '/images/donut.svg', TRUE),
  (4, 'Toast', 35.00, 'Butter toast', '/images/toast.svg', TRUE),
  (4, 'Sandwich', 65.00, 'Ham and cheese sandwich', '/images/sandwich.svg', TRUE),
  (5, 'Vanilla', 60.00, 'Classic vanilla ice cream', '/images/vanilla.svg', TRUE),
  (5, 'Chocolate Ice Cream', 65.00, 'Rich chocolate ice cream', '/images/chocolate-icecream.svg', TRUE),
  (5, 'Strawberry Ice Cream', 60.00, 'Fresh strawberry ice cream', '/images/strawberry-icecream.svg', TRUE),
  (5, 'Matcha Ice Cream', 70.00, 'Matcha ice cream', '/images/matcha-icecream.svg', TRUE),
  (5, 'Cookie Dough', 75.00, 'Cookie dough ice cream', '/images/cookie-dough.svg', TRUE);

-- Sample Orders
INSERT INTO orders (user_id, total_amount, status, created_at) VALUES
  (2, 270.00, 'completed', NOW() - INTERVAL '3 DAY'),
  (2, 190.00, 'completed', NOW() - INTERVAL '2 DAY'),
  (2, 105.00, 'pending', NOW() - INTERVAL '1 HOUR'),
  (2, 215.00, 'preparing', NOW() - INTERVAL '30 MINUTE'),
  (2, 105.00, 'cancelled', NOW() - INTERVAL '2 DAY');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total) VALUES
  (1, 1, 1, 80.00, 80.00),
  (1, 2, 1, 95.00, 95.00),
  (1, 15, 2, 55.00, 110.00),
  (2, 4, 2, 75.00, 150.00),
  (2, 16, 1, 45.00, 45.00),
  (3, 7, 1, 65.00, 65.00),
  (3, 17, 1, 40.00, 40.00),
  (4, 5, 1, 105.00, 105.00),
  (4, 9, 1, 110.00, 110.00),
  (4, 19, 1, 65.00, 65.00),
  (5, 6, 1, 70.00, 70.00),
  (5, 18, 1, 35.00, 35.00);
