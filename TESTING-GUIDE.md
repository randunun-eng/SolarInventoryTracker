# Testing Guide - Solar Inventory Tracker

## 🎭 Mock Mode (Frontend Testing Without D1 Database)

You can test the entire frontend UI without connecting to the D1 database using mock data mode.

### Enable Mock Mode

**Option 1: Environment Variable**
```bash
# Create .env file in client directory
cp client/.env.mock client/.env

# Build with mock data
npm run build:mock

# Deploy with mock data
npm run deploy:mock
```

**Option 2: Manual .env Setup**
```bash
# client/.env
VITE_USE_MOCK_DATA=true
```

### Build Commands

```bash
# Production build (real D1 database)
npm run build
npm run deploy

# Mock build (no database needed)
npm run build:mock
npm run deploy:mock
```

### What Mock Mode Provides

Mock data includes:
- ✅ **Components**: 3 sample components (Solar panels, inverters, batteries)
- ✅ **Categories**: 4 component categories
- ✅ **Suppliers**: 2 sample suppliers
- ✅ **Clients**: 2 sample clients
- ✅ **Repairs**: 2 sample repair jobs
- ✅ **Users**: Admin and technician accounts
- ✅ **Stats**: Dashboard statistics

### Features Available in Mock Mode

All frontend features work:
- ✅ Navigation and routing
- ✅ UI components and layouts
- ✅ Forms and validation
- ✅ Data display (tables, cards, charts)
- ✅ Search and filtering
- ✅ Modals and dialogs
- ✅ Authentication UI flow

### Features NOT Available in Mock Mode

- ❌ Data persistence (changes won't save)
- ❌ Real database operations
- ❌ API mutations (create, update, delete)
- ❌ AI features (requires Cloudflare Workers AI)
- ❌ Session management

## 🌐 Production Mode (With D1 Database)

### Prerequisites

1. **D1 Database Setup**
```bash
# Create D1 database
wrangler d1 create solar-inventory-db

# Update wrangler.toml with database_id
# Run migrations
wrangler d1 execute solar-inventory-db --file=migrations/0001_create_schema.sql
wrangler d1 execute solar-inventory-db --file=migrations/0002_seed_users.sql
```

2. **Build and Deploy**
```bash
npm run build
npm run deploy
```

### Verify Deployment

Check that Functions are deployed:
```bash
# You should see these messages:
✨ Uploading Functions bundle
✨ Uploading _routes.json
🌎 Deploying...
✨ Deployment complete!
```

### Test API Endpoints

```bash
# Test components API
curl https://solar-inventory-tracker.pages.dev/api/components

# Test auth API
curl https://solar-inventory-tracker.pages.dev/api/auth/me
```

## 🔍 Troubleshooting

### Blank Page on `/components`

**Issue**: Page shows blank or white screen

**Solutions**:
1. **Check Browser Console** - Press F12, look for errors
2. **Verify Functions Deployed** - Check deployment logs for "Uploading Functions bundle"
3. **Check D1 Database** - Ensure migrations ran successfully
4. **Use Mock Mode** - Test frontend without database: `npm run build:mock && npm run deploy:mock`

### API Errors (403, 500, etc.)

**Issue**: API calls fail with errors

**Solutions**:
1. **Check D1 Binding** - Verify `wrangler.toml` has correct `database_id`
2. **Run Migrations** - Database tables must exist
3. **Check KV Binding** - Sessions require KV namespace
4. **Use Mock Mode** - Bypass API entirely for frontend testing

### Functions Not Found (404)

**Issue**: `/api/*` routes return 404

**Solutions**:
1. **Rebuild Project** - `npm run build`
2. **Check Build Output** - Verify `dist/public/functions/` exists
3. **Verify _routes.json** - Must be in `dist/public/`
4. **Redeploy** - `npm run deploy`

## 📝 Quick Reference

### Development Workflow

```bash
# 1. Test frontend only (no database)
npm run build:mock
npm run deploy:mock

# 2. Test with local database
npm run dev

# 3. Production deploy with D1
npm run build
npm run deploy
```

### Login Credentials

**Admin Account**
- Username: `admin`
- Password: `admin`

**Technician Account**
- Username: `tech1`
- Password: `tech123`

### Important Files

- `client/.env.mock` - Mock mode configuration
- `client/.env.production` - Production configuration
- `client/src/lib/mockData.ts` - Mock data provider
- `functions/api/` - Cloudflare Pages Functions
- `wrangler.toml` - Cloudflare configuration
- `_routes.json` - Routes configuration for Pages

## 🎯 Testing Checklist

### Frontend Testing (Mock Mode)
- [ ] Login page loads
- [ ] Dashboard shows statistics
- [ ] Components page displays table
- [ ] Can navigate between pages
- [ ] Forms open and validate
- [ ] Search and filters work
- [ ] UI components render correctly

### Full Stack Testing (Production)
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] Authentication succeeds
- [ ] Data persists after refresh
- [ ] CRUD operations work
- [ ] AI features respond
- [ ] Session management works

---

**Need Help?**
- Check browser console (F12)
- Review Cloudflare Pages deployment logs
- Check Wrangler output for errors
- Verify environment variables
