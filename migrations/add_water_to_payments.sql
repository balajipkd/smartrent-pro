-- Add water column to payments table
-- Captures the water charge portion of a payment (previously written in notes/comments)
-- Stored as a numeric amount in INR

ALTER TABLE payments
ADD COLUMN water NUMERIC DEFAULT 0;

COMMENT ON COLUMN payments.water IS 'Water charge component of the payment (INR). Previously captured in notes.';
