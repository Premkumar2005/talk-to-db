CREATE DATABASE IF NOT EXISTS talktodb;
USE talktodb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2),
  txn_date DATE,
  status VARCHAR(50),
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

INSERT INTO users (name, email) VALUES
('Alice', 'alice@example.com'),
('Bob', 'bob@example.com'),
('Carol', 'carol@example.com');

INSERT INTO transactions (user_id, amount, txn_date, status) VALUES
(1, 120.50, '2024-01-05', 'completed'),
(1, 45.00, '2024-02-01', 'completed'),
(2, 560.00, '2024-02-12', 'failed'),
(3, 30.00, '2024-03-15', 'completed'),
(2, 250.00, '2024-03-20', 'completed');
