-- Create expenses table for tracking user expenses
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user',
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- Create index on date for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- Create index on category for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Removed the insert into users_sync table to avoid ID constraint error
