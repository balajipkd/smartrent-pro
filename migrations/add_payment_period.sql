-- Add payment_period column to payments table
-- This column stores the month/year for which the rent payment is for
-- Format: YYYY-MM-DD (stored as first day of month, e.g., '2026-01-01' for January 2026)

ALTER TABLE payments 
ADD COLUMN payment_period DATE;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN payments.payment_period IS 'The month/year this payment is for (stored as YYYY-MM-DD, first day of month)';
