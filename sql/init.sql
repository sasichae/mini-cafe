USE mini_cafe;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, name, role) VALUES
  ('admin', 'admin123', 'Admin User', 'admin'),
  ('staff', 'staff123', 'Staff User', 'staff')
ON DUPLICATE KEY UPDATE username = username;
