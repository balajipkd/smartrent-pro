-- Add show_when_dashboard_is_loaded column to buildings table
-- This column indicates if the building should be selected by default on the dashboard
ALTER TABLE buildings 
ADD COLUMN show_when_dashboard_is_loaded BOOLEAN DEFAULT false;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN buildings.show_when_dashboard_is_loaded IS 'True if this building should be selected by default when the dashboard is loaded';
