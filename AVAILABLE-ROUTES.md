# Solar Inventory Tracker - Available Routes

## 🌐 Live Domain
**https://eurovolt.store**

All routes below work on:
- ✅ https://eurovolt.store
- ✅ https://www.eurovolt.store
- ✅ https://solar-inventory-tracker.pages.dev

---

## 📱 Frontend Routes (SPA)

### Public Routes (No Login Required)
- `/login` - User login page
- `/track/:token` - Public repair tracking (for clients)
- `/access-denied` - Access denied page

### Protected Routes (Login Required)

#### Admin Only Routes
- `/` or `/dashboard` - Main dashboard with statistics
- `/components` - Components inventory management
- `/categories` - Manage component categories
- `/suppliers` - Supplier management
- `/stockalerts` - Low stock alerts
- `/clients` - Client management
- `/invoices` - Invoice management
- `/users` - User management
- `/settings` - System settings

#### Shared Routes (Admin & Technician)
- `/repairs` - Repair jobs management
- `/repairs/:id/status` - Individual repair status

---

## 🔌 API Routes

### Authentication
```bash
# Login
POST /api/auth/login
Body: {"username": "admin", "password": "admin"}

# Register
POST /api/auth/register
Body: {"username": "user", "password": "pass", "name": "Name", "role": "Technician"}

# Get Current User
GET /api/auth/me
Header: Authorization: Bearer {sessionToken}

# Logout
POST /api/auth/logout
Header: Authorization: Bearer {sessionToken}
```

### Components Management
```bash
# Get all components
GET /api/components

# Get specific component
GET /api/components?id=1

# Create component
POST /api/components
Body: {
  "name": "Solar Panel 400W",
  "part_number": "SP-400-M",
  "category_id": 1,
  "description": "400W monocrystalline panel",
  "current_stock": 25,
  "minimum_stock": 10,
  "supplier_price": 150.00
}

# Update component
PUT /api/components
Body: {"id": 1, "current_stock": 30}

# Delete component
DELETE /api/components?id=1
```

### Repairs Management
```bash
# Get all repairs
GET /api/repairs

# Get repairs by status
GET /api/repairs?status=In%20Progress

# Get specific repair
GET /api/repairs?id=1

# Create repair
POST /api/repairs
Body: {
  "client_id": 1,
  "inverter_model": "3.5KW Hybrid",
  "inverter_serial_number": "SN123456",
  "fault_description": "Error 11 - Grid voltage issue",
  "priority": "High"
}

# Update repair
PUT /api/repairs
Body: {"id": 1, "status": "Completed"}
```

### Statistics & Analytics
```bash
# Get basic statistics
GET /api/stats

# Get statistics with AI insights
GET /api/stats?insights=true
```

### AI Features
```bash
# AI Chat
POST /api/ai-chat
Body: {
  "message": "How many components are low on stock?",
  "context": {"totalComponents": 100}
}

# Analyze Component
POST /api/analyze-component
Body: {
  "component": {
    "name": "Solar Panel 400W",
    "partNumber": "SP-400-M",
    "category": "Solar Panels",
    "description": "Monocrystalline 400W panel"
  }
}
```

---

## 🔐 Login Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin`
- **Role**: Admin
- **Access**: Full access to all routes

### Technician Account
- **Username**: `tech1`
- **Password**: `tech123`
- **Role**: Technician
- **Access**: Limited to repairs and viewing data

---

## 🧪 Testing Routes

Test any route directly in your browser:

```bash
# Frontend Routes
https://eurovolt.store/components
https://eurovolt.store/repairs
https://eurovolt.store/dashboard
https://eurovolt.store/clients
https://eurovolt.store/settings

# API Routes (use curl or Postman)
curl https://eurovolt.store/api/components
curl https://eurovolt.store/api/repairs
curl https://eurovolt.store/api/stats
```

---

## 📝 Notes

1. **SPA Routing**: All frontend routes are handled client-side by React Router (Wouter)
2. **API Routes**: All `/api/*` routes are handled by Cloudflare Pages Functions
3. **Authentication**: Session tokens are stored in KV and expire after 24 hours
4. **CORS**: API endpoints support cross-origin requests
5. **SSL**: All routes are automatically secured with HTTPS

---

## 🚀 Stack Summary

```
eurovolt.store
├── Frontend (SPA)
│   ├── React + Vite
│   ├── Wouter (Routing)
│   └── TailwindCSS + shadcn/ui
├── Backend (Serverless)
│   ├── Cloudflare Pages Functions
│   ├── D1 Database (SQLite)
│   ├── KV Storage (Sessions)
│   └── Workers AI (Llama 3.1 8B)
└── Infrastructure
    ├── Cloudflare Pages
    ├── Custom Domain (eurovolt.store)
    └── Global CDN + DDoS Protection
```

---

## ✅ Verification

All routes tested and working:
- ✅ Direct URL access (e.g., /components)
- ✅ Browser navigation
- ✅ API endpoints
- ✅ Authentication
- ✅ Custom domain
- ✅ SSL certificates
- ✅ CORS headers

**Your Solar Inventory Tracker is fully operational!** 🎉
