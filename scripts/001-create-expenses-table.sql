-- Create expenses table with IP address tracking
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
