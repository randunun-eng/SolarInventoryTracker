-- ElectroTrack D1 Database Schema
-- SQLite migration for Cloudflare D1

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Suppliers table
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

-- Components table
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
  last_purchase_date TEXT, -- ISO 8601 format
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  component_id INTEGER NOT NULL,
  supplier_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  date TEXT NOT NULL, -- ISO 8601 format
  FOREIGN KEY (component_id) REFERENCES components(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  notes TEXT
);

-- Inverters table
CREATE TABLE IF NOT EXISTS inverters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  brand TEXT,
  model TEXT,
  capacity REAL,
  installation_date TEXT, -- ISO 8601 format
  warranty_expiry TEXT, -- ISO 8601 format
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Fault types table
CREATE TABLE IF NOT EXISTS fault_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  common_solution TEXT
);

-- Repairs table
CREATE TABLE IF NOT EXISTS repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  inverter_id INTEGER NOT NULL,
  fault_type_id INTEGER,
  date_received TEXT NOT NULL, -- ISO 8601 format
  date_completed TEXT,
  estimated_completion_date TEXT,
  status TEXT DEFAULT 'Received',
  description TEXT,
  technician_notes TEXT,
  photos TEXT, -- JSON array stored as text
  status_history TEXT, -- JSON array stored as text
  labor_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  tracking_token TEXT UNIQUE,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (inverter_id) REFERENCES inverters(id),
  FOREIGN KEY (fault_type_id) REFERENCES fault_types(id)
);

-- Used components table
CREATE TABLE IF NOT EXISTS used_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repair_id INTEGER NOT NULL,
  component_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL,
  FOREIGN KEY (repair_id) REFERENCES repairs(id),
  FOREIGN KEY (component_id) REFERENCES components(id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Technician'
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT -- JSON stored as text
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id);
CREATE INDEX IF NOT EXISTS idx_components_supplier ON components(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inverters_client ON inverters(client_id);
CREATE INDEX IF NOT EXISTS idx_inverters_serial ON inverters(serial_number);
CREATE INDEX IF NOT EXISTS idx_repairs_client ON repairs(client_id);
CREATE INDEX IF NOT EXISTS idx_repairs_inverter ON repairs(inverter_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_tracking_token ON repairs(tracking_token);
CREATE INDEX IF NOT EXISTS idx_used_components_repair ON used_components(repair_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
