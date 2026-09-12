USE mini_cafe;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'preparing', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(order_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$10$lEu9QOvClvlCAG.wMFe6v.yb7LFbSDAaDptpoy9MBqHL9w6/bqyLu', 'admin'),
  ('staff', '$2b$10$ByB5xY1Slxy0O08kTG/jMuNAkCMdF1vym4J4WIyqh4y37fSY0dVjm', 'staff')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO categories (name) VALUES
  ('Coffee'),
  ('Tea'),
  ('Non-Coffee'),
  ('Bakery'),
  ('Ice Cream')
ON DUPLICATE KEY UPDATE name = name;

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
  (5, 'Chocolate', 65.00, 'Rich chocolate ice cream', '/images/chocolate-icecream.svg', TRUE),
  (5, 'Strawberry', 60.00, 'Fresh strawberry ice cream', '/images/strawberry-icecream.svg', TRUE),
  (5, 'Matcha', 70.00, 'Matcha ice cream', '/images/matcha-icecream.svg', TRUE),
  (5, 'Cookie Dough', 75.00, 'Cookie dough ice cream', '/images/cookie-dough.svg', TRUE)
ON DUPLICATE KEY UPDATE name = name;
