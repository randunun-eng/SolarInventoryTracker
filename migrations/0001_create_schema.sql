-- Solar Inventory Tracker D1 Database Schema
-- Migrated from PostgreSQL to SQLite

-- Categories for components
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  remarks TEXT,
  tags TEXT -- JSON array stored as text
);

-- Electronic Components
CREATE TABLE IF NOT EXISTS components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  part_number TEXT,
  category_id INTEGER,
  description TEXT,
  datasheet TEXT,
  image TEXT,
  location TEXT,
  minimum_stock INTEGER DEFAULT 10,
  current_stock INTEGER DEFAULT 0,
  supplier_price REAL DEFAULT 0,
  supplier_id INTEGER,
  last_purchase_date TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Purchase History
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  component_id INTEGER NOT NULL,
  supplier_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (component_id) REFERENCES components(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT
);

-- Inverters
CREATE TABLE IF NOT EXISTS inverters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  warranty_status TEXT DEFAULT 'Valid',
  installation_date TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Common Fault Types
CREATE TABLE IF NOT EXISTS fault_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Repair Logs
CREATE TABLE IF NOT EXISTS repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inverter_id INTEGER,
  client_id INTEGER NOT NULL,
  fault_type_id INTEGER,
  fault_description TEXT,
  status TEXT DEFAULT 'Received',
  received_date TEXT NOT NULL,
  estimated_completion_date TEXT,
  completion_date TEXT,
  labor_hours REAL DEFAULT 0,
  labor_rate REAL DEFAULT 85,
  technician_name TEXT,
  technician_notes TEXT,
  before_photos TEXT, -- JSON array
  after_photos TEXT, -- JSON array
  total_parts_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  inverter_model TEXT,
  inverter_serial_number TEXT,
  status_history TEXT, -- JSON array
  remarks TEXT,
  priority TEXT DEFAULT 'Medium',
  tracking_token TEXT UNIQUE,
  FOREIGN KEY (inverter_id) REFERENCES inverters(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (fault_type_id) REFERENCES fault_types(id)
);

-- Used Components in Repairs (Many-to-Many)
CREATE TABLE IF NOT EXISTS used_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repair_id INTEGER NOT NULL,
  component_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (repair_id) REFERENCES repairs(id),
  FOREIGN KEY (component_id) REFERENCES components(id)
);

-- Users (for authentication/authorization)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'Technician'
);

-- Settings table for application-wide configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL, -- JSON stored as text
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id);
CREATE INDEX IF NOT EXISTS idx_components_supplier ON components(supplier_id);
CREATE INDEX IF NOT EXISTS idx_components_stock ON components(current_stock);
CREATE INDEX IF NOT EXISTS idx_purchases_component ON purchases(component_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inverters_client ON inverters(client_id);
CREATE INDEX IF NOT EXISTS idx_inverters_serial ON inverters(serial_number);
CREATE INDEX IF NOT EXISTS idx_repairs_client ON repairs(client_id);
CREATE INDEX IF NOT EXISTS idx_repairs_inverter ON repairs(inverter_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_tracking ON repairs(tracking_token);
CREATE INDEX IF NOT EXISTS idx_used_components_repair ON used_components(repair_id);
CREATE INDEX IF NOT EXISTS idx_used_components_component ON used_components(component_id);
