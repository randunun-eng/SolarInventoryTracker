-- Seed data: Create default admin user
-- Default credentials: admin / admin123
-- IMPORTANT: Change the password after first login!

INSERT OR IGNORE INTO users (username, password, name, role)
VALUES ('admin', 'admin123', 'Administrator', 'Admin');

-- Create a test technician user
INSERT OR IGNORE INTO users (username, password, name, role)
VALUES ('tech1', 'tech123', 'Test Technician', 'Technician');

-- Add some sample categories
INSERT OR IGNORE INTO categories (name, description)
VALUES
  ('Solar Panels', 'Photovoltaic panels and modules'),
  ('Inverters', 'DC to AC power inverters'),
  ('Batteries', 'Energy storage batteries'),
  ('Controllers', 'Charge controllers and MPPT devices'),
  ('Capacitors', 'Various capacitors'),
  ('Resistors', 'Various resistors'),
  ('ICs', 'Integrated circuits'),
  ('Connectors', 'Electrical connectors and terminals');

-- Add sample fault types
INSERT OR IGNORE INTO fault_types (name, description)
VALUES
  ('Error 11', 'Grid voltage error'),
  ('Error 13', 'Isolation fault'),
  ('Error 24', 'Communication error'),
  ('No Power', 'Inverter not producing power'),
  ('Overheating', 'Temperature too high'),
  ('Fan Failure', 'Cooling fan not working');
