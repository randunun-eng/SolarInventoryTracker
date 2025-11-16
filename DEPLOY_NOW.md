# 🚀 Deploy Your Worker NOW (Copy-Paste Ready!)

Since CLI isn't working due to proxy, use the Dashboard. **Total time: 10 minutes**

---

## Step 1: Create D1 Database (2 min)

1. Go to: https://dash.cloudflare.com
2. **Workers & Pages** → **D1 SQL Database**
3. Click **Create database**
4. Name: `solar-inventory-tracker-db`
5. Click **Create**

**Copy the database_id** shown (looks like `abc123-def456-...`)

---

## Step 2: Run Migrations (3 min)

In your new D1 database:

1. Click **Console** tab
2. Copy and paste this **ENTIRE SQL** (all at once):

```sql
-- ElectroTrack D1 Database Schema
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  remarks TEXT,
  tags TEXT
);

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

CREATE TABLE IF NOT EXISTS inverters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  brand TEXT,
  model TEXT,
  capacity REAL,
  installation_date TEXT,
  warranty_expiry TEXT,
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS fault_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  common_solution TEXT
);

CREATE TABLE IF NOT EXISTS repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  inverter_id INTEGER NOT NULL,
  fault_type_id INTEGER,
  date_received TEXT NOT NULL,
  date_completed TEXT,
  estimated_completion_date TEXT,
  status TEXT DEFAULT 'Received',
  description TEXT,
  technician_notes TEXT,
  photos TEXT,
  status_history TEXT,
  labor_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  tracking_token TEXT UNIQUE,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (inverter_id) REFERENCES inverters(id),
  FOREIGN KEY (fault_type_id) REFERENCES fault_types(id)
);

CREATE TABLE IF NOT EXISTS used_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repair_id INTEGER NOT NULL,
  component_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL,
  FOREIGN KEY (repair_id) REFERENCES repairs(id),
  FOREIGN KEY (component_id) REFERENCES components(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Technician'
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT
);

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
```

3. Click **Execute**

4. Then copy and paste this (seed data):

```sql
-- Admin user (password: 'admin')
INSERT INTO users (username, password, role)
VALUES ('admin', '$2b$10$BzpQih.dfmOhQyxaj2dKp.N4d2PaD8YuhTyxQC4/3ROuTBc7CrV/K', 'Admin');

-- Test user (password: 'test123')
INSERT INTO users (username, password, role)
VALUES ('test', '$2b$10$raUjFCmKhBxHuVT0.qo3pu0Jyx8vO0H41UPdAJj.mDIUI.sQu.SUi', 'Technician');

-- Default settings
INSERT INTO settings (key, value)
VALUES ('general', '{"currency":"LKR","currencySymbol":"Rs","taxRate":0,"laborRate":0}');

-- Categories
INSERT INTO categories (name, description) VALUES
  ('Capacitors', 'Capacitors and related components'),
  ('Resistors', 'Resistors and potentiometers'),
  ('Semiconductors', 'Diodes, transistors, and ICs'),
  ('Power Components', 'Power MOSFETs, IGBTs, and power modules'),
  ('Connectors', 'Terminals and connectors'),
  ('Passive Components', 'Inductors, transformers, and filters');

-- Fault types
INSERT INTO fault_types (name, description, common_solution) VALUES
  ('No Output', 'Inverter shows no output voltage', 'Check power MOSFETs, gate drivers, and control circuitry'),
  ('Low Output Voltage', 'Output voltage below rated specification', 'Inspect feedback circuit, PWM controller, and output filter'),
  ('Overheating', 'Inverter shuts down due to thermal protection', 'Clean heatsinks, check fans, verify thermal paste'),
  ('Ground Fault', 'Ground fault detection triggered', 'Check isolation, inspect DC input cables and connectors'),
  ('Display Issue', 'LCD display not working or showing errors', 'Check display connections, replace if necessary'),
  ('Communication Error', 'Unable to communicate with monitoring system', 'Verify WiFi/Ethernet connections, check communication module');
```

5. Click **Execute**

✅ Database is ready!

---

## Step 3: Create KV Namespace (1 min)

1. **Workers & Pages** → **KV**
2. Click **Create a namespace**
3. Name: `SESSIONS`
4. Click **Add**

---

## Step 4: Create R2 Bucket (1 min)

1. **R2**
2. Click **Create bucket**
3. Name: `solar-inventory-uploads`
4. Click **Create bucket**

---

## Step 5: Deploy Worker (2 min)

1. **Workers & Pages** → **Create**
2. **Workers** → **Create Worker**
3. Name: `solar-inventory-tracker-api`
4. Click **Deploy**
5. Click **Edit Code**
6. **Delete all the default code**
7. Open: `dist-worker/index.js` on your computer
8. **Copy ALL contents** (it's 325 KB / ~9000 lines)
9. **Paste** into Cloudflare editor
10. Click **Deploy**

**📋 Copy your Worker URL!**

---

## Step 6: Configure Bindings (2 min)

Click **Settings** → **Variables and Secrets**

### A) D1 Database Binding

Scroll to **D1 Database Bindings**:
- Variable name: `DB`
- D1 database: `solar-inventory-tracker-db`
- Click **Save**

### B) KV Namespace Binding

Scroll to **KV Namespace Bindings**:
- Variable name: `SESSIONS`
- KV namespace: `SESSIONS`
- Click **Save**

### C) R2 Bucket Binding

Scroll to **R2 Bucket Bindings**:
- Variable name: `UPLOADS`
- R2 bucket: `solar-inventory-uploads`
- Click **Save**

---

## Step 7: Set Secrets (2 min)

Still in **Variables and Secrets**, click **Add variable** for each:

1. **SESSION_SECRET** (Encrypted)
   - Value: `electrotrack-super-secret-session-key-change-in-production-2024`

2. **OPENAI_API_KEY** (Encrypted)
   - Value: `sk-QUq6LniC21EVlKeJ97611786Db48400bB687Df84Af117b0c`

3. **OPENAI_API_BASE** (Encrypted)
   - Value: `https://api.laozhang.ai/v1`

Click **Save and Deploy** after each.

---

## Step 8: TEST! (1 min)

### Test 1: Health Check

Visit: `https://YOUR_WORKER_URL/health`

Expected:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "environment": "production"
}
```

### Test 2: Login

```bash
curl -X POST https://YOUR_WORKER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Expected: Returns user data with admin role!

---

## ✅ YOU'RE LIVE!

Your backend is now running 100% on Cloudflare:

- ✅ API: Cloudflare Workers
- ✅ Database: Cloudflare D1
- ✅ Files: Cloudflare R2
- ✅ Sessions: Cloudflare KV
- ✅ Frontend: Already deployed!

---

## 🎯 Login Credentials

**Admin:**
- Username: `admin`
- Password: `admin`

**Test User:**
- Username: `test`
- Password: `test123`

---

## 📱 Connect Frontend

Update your Pages environment variable:

1. **Workers & Pages** → Your Pages project
2. **Settings** → **Environment variables**
3. Add:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR_WORKER_URL` (from Step 5)
   - Environment: Production
4. Click **Save**
5. **Redeploy** frontend

---

## 🎉 Done!

Your entire app is now live and free!

**Need help?** Check Worker logs: Dashboard → Your Worker → Logs

**Have fun!** 🚀
