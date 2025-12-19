-- Add ip_address column to existing expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- Create index for potential IP-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_ip ON expenses(ip_address);
