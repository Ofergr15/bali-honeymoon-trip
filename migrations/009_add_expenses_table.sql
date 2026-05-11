-- Add expenses tracking table
-- This migration adds support for tracking trip expenses per day

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g., 'food', 'transport', 'accommodation', 'activities', 'shopping', 'other'
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD', -- USD, THB (Thai Baht), IDR (Indonesian Rupiah)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_expenses_day_id ON expenses(day_id);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow all access (following existing pattern)
CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE expenses IS 'Stores daily expenses for trip budgeting and cost tracking';
COMMENT ON COLUMN expenses.category IS 'Expense category: food, transport, accommodation, activities, shopping, other';
COMMENT ON COLUMN expenses.currency IS 'Currency code: USD, THB (Thai Baht), IDR (Indonesian Rupiah), etc.';
