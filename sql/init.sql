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
  ('Pastry'),
  ('Snack')
ON DUPLICATE KEY UPDATE name = name;

INSERT INTO products (category_id, name, price, description) VALUES
  (1, 'Espresso', 80.00, 'Strong black coffee'),
  (1, 'Latte', 95.00, 'Coffee with steamed milk'),
  (1, 'Cappuccino', 95.00, 'Coffee with foam'),
  (2, 'Green Tea', 70.00, 'Japanese green tea'),
  (2, 'Thai Tea', 65.00, 'Sweet Thai tea'),
  (3, 'Croissant', 55.00, 'Butter croissant'),
  (3, 'Muffin', 45.00, 'Blueberry muffin'),
  (4, 'French Fries', 60.00, 'Crispy fries')
ON DUPLICATE KEY UPDATE name = name;
