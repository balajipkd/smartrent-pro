-- Add water_charge column to leases table
-- Stores the recurring monthly water charge agreed in the lease (INR)
-- This value is auto-loaded into the payment screen and can be overridden per payment

ALTER TABLE leases
ADD COLUMN water_charge NUMERIC DEFAULT 0;

COMMENT ON COLUMN leases.water_charge IS 'Recurring monthly water charge for the lease (INR). Auto-loaded into the payment form.';
