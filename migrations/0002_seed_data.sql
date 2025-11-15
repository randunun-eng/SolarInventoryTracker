-- Seed initial data for ElectroTrack

-- Insert admin user (password: 'admin')
INSERT INTO users (username, password, role)
VALUES ('admin', '$2b$10$BzpQih.dfmOhQyxaj2dKp.N4d2PaD8YuhTyxQC4/3ROuTBc7CrV/K', 'Admin');

-- Insert test user (password: 'test123')
INSERT INTO users (username, password, role)
VALUES ('test', '$2b$10$raUjFCmKhBxHuVT0.qo3pu0Jyx8vO0H41UPdAJj.mDIUI.sQu.SUi', 'Technician');

-- Insert default settings
INSERT INTO settings (key, value)
VALUES ('general', '{"currency":"LKR","currencySymbol":"Rs","taxRate":0,"laborRate":0}');

-- Insert some default categories
INSERT INTO categories (name, description)
VALUES
  ('Capacitors', 'Capacitors and related components'),
  ('Resistors', 'Resistors and potentiometers'),
  ('Semiconductors', 'Diodes, transistors, and ICs'),
  ('Power Components', 'Power MOSFETs, IGBTs, and power modules'),
  ('Connectors', 'Terminals and connectors'),
  ('Passive Components', 'Inductors, transformers, and filters');

-- Insert some common fault types
INSERT INTO fault_types (name, description, common_solution)
VALUES
  ('No Output', 'Inverter shows no output voltage', 'Check power MOSFETs, gate drivers, and control circuitry'),
  ('Low Output Voltage', 'Output voltage below rated specification', 'Inspect feedback circuit, PWM controller, and output filter'),
  ('Overheating', 'Inverter shuts down due to thermal protection', 'Clean heatsinks, check fans, verify thermal paste'),
  ('Ground Fault', 'Ground fault detection triggered', 'Check isolation, inspect DC input cables and connectors'),
  ('Display Issue', 'LCD display not working or showing errors', 'Check display connections, replace if necessary'),
  ('Communication Error', 'Unable to communicate with monitoring system', 'Verify WiFi/Ethernet connections, check communication module');
