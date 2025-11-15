# 🚀 Deploy with Cloudflare D1 Database

**Total Time: ~15 minutes** | **100% Free Tier** ✅

Your Worker is now configured to use **Cloudflare D1** (built-in SQLite database) instead of Neon!

---

## ✅ What's Ready

- ✅ Worker code built: `dist-worker/index.js` (325 KB)
- ✅ D1 database schema: `migrations/0001_create_tables.sql`
- ✅ Seed data with admin user: `migrations/0002_seed_data.sql`
- ✅ All code updated to use D1

---

## 📋 Step-by-Step Deployment

### Step 1: Create D1 Database (Cloudflare Dashboard)

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** → **D1 SQL Database**
3. Click **Create database**
4. Name: `solar-inventory-tracker-db`
5. Click **Create**
6. **📋 Copy the Database ID** (looks like `abc123-def456...`)

---

### Step 2: Create KV Namespace

1. Go to **Workers & Pages** → **KV**
2. Click **Create a namespace**
3. Name: `SESSIONS`
4. Click **Add**
5. **📋 Copy the Namespace ID**

---

### Step 3: Create R2 Bucket

1. Go to **R2**
2. Click **Create bucket**
3. Name: `solar-inventory-uploads`
4. Click **Create bucket**

---

### Step 4: Initialize D1 Database (Run Migrations)

You need to run the SQL migrations to create the tables. You have two options:

#### Option A: Via Dashboard (Easiest)

1. Go to your D1 database in Cloudflare Dashboard
2. Click **Console** tab
3. Copy and paste **ALL** contents from `migrations/0001_create_tables.sql`
4. Click **Execute**
5. Then copy and paste contents from `migrations/0002_seed_data.sql`
6. Click **Execute**

#### Option B: Via Wrangler CLI (if you have access)

```bash
# First update wrangler.toml with your database ID
# Then run:
npx wrangler d1 execute solar-inventory-tracker-db --file=migrations/0001_create_tables.sql
npx wrangler d1 execute solar-inventory-tracker-db --file=migrations/0002_seed_data.sql
```

---

### Step 5: Create the Worker

1. Go to **Workers & Pages**
2. Click **Create** → **Workers**
3. Name: `solar-inventory-tracker-api`
4. Click **Deploy**
5. Click **Edit Code**
6. **Delete all default code**
7. Copy **ALL** contents from `dist-worker/index.js`
8. Paste into editor
9. Click **Deploy**

**📋 Copy your Worker URL:**
```
https://solar-inventory-tracker-api.YOUR_SUBDOMAIN.workers.dev
```

---

### Step 6: Configure Bindings

Go to **Settings** → **Variables and Secrets**

#### A) D1 Database Binding

1. Scroll to **D1 Database Bindings**
2. Click **Add binding**
3. Variable name: `DB` (must match exactly!)
4. D1 database: Select `solar-inventory-tracker-db`
5. Click **Save**

#### B) KV Namespace Binding

1. Scroll to **KV Namespace Bindings**
2. Click **Add binding**
3. Variable name: `SESSIONS`
4. KV namespace: Select `SESSIONS`
5. Click **Save**

#### C) R2 Bucket Binding

1. Scroll to **R2 Bucket Bindings**
2. Click **Add binding**
3. Variable name: `UPLOADS`
4. R2 bucket: Select `solar-inventory-uploads`
5. Click **Save**

---

### Step 7: Set Environment Variables

Still in **Settings** → **Variables and Secrets**:

#### Required Secrets:

1. **SESSION_SECRET** (Secret/Encrypted)
   - Value: Any random 32+ character string
   - Generate: `openssl rand -base64 32`
   - Or use: `$(head -c 32 /dev/urandom | base64)`

2. **OPENAI_API_KEY** (Secret/Encrypted)
   - Value: `sk-QUq6LniC21EVlKeJ97611786Db48400bB687Df84Af117b0c`

3. **OPENAI_API_BASE** (Secret/Encrypted)
   - Value: `https://api.laozhang.ai/v1`

#### Optional Variable:

4. **NODE_ENV** (Plain text)
   - Value: `production`

Click **Save and Deploy** after each secret.

---

### Step 8: Test the Worker

#### Test Health Endpoint:
```
https://YOUR_WORKER_URL/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "environment": "production"
}
```

#### Test Login:
```bash
curl -X POST https://YOUR_WORKER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

✅ Should return user data!

---

### Step 9: Connect Frontend

Update your Cloudflare Pages environment variable:

1. Go to **Workers & Pages**
2. Find your Pages deployment
3. Click **Settings** → **Environment variables**
4. Add:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR_WORKER_URL`
   - Environment: Production
5. Click **Save**
6. Redeploy frontend

---

## ✅ You're Live!

Your full stack is now running 100% on Cloudflare:

- ✅ **Frontend**: Cloudflare Pages
- ✅ **Backend API**: Cloudflare Workers
- ✅ **Database**: Cloudflare D1 (SQLite)
- ✅ **File Storage**: Cloudflare R2
- ✅ **Session Storage**: Cloudflare KV
- ✅ **AI Service**: OpenAI

---

## 🎯 Default Login Credentials

**Admin User:**
- Username: `admin`
- Password: `admin`

**Test User (Technician):**
- Username: `test`
- Password: `test123`

**⚠️ IMPORTANT:** Change the admin password after first login!

---

## 💰 Free Tier Limits

D1 makes this even more generous:

| Resource | Free Limit | Your Usage |
|----------|------------|------------|
| Workers Requests | 100,000/day | ~1,000/day ✓ |
| Worker Size | 1 MB | 325 KB ✓✓ |
| D1 Reads | 5M/day | ~10,000/day ✓ |
| D1 Writes | 100,000/day | ~1,000/day ✓ |
| D1 Storage | 5 GB | <10 MB ✓ |
| KV Reads | 100,000/day | ~5,000/day ✓ |
| R2 Storage | 10 GB | <1 GB ✓ |

**You're well within all limits!** 🎉

---

## 📊 Database Management

### View Data

1. Go to your D1 database in Dashboard
2. Click **Console** tab
3. Run SQL queries:
```sql
-- View all users
SELECT id, username, role FROM users;

-- View repairs
SELECT * FROM repairs LIMIT 10;

-- View components
SELECT * FROM components;
```

### Add More Users

```sql
-- Password hashes are bcryptjs hashed
INSERT INTO users (username, password, role)
VALUES ('newuser', '$2b$10$...', 'Technician');
```

---

## 🐛 Troubleshooting

### Login Not Working?

1. **Check D1 binding**: Variable name must be exactly `DB`
2. **Verify migrations ran**: Query `SELECT * FROM users` in D1 Console
3. **Check Worker logs**: Dashboard → Your Worker → Logs

### "Database not found" error?

- Verify D1 database binding is configured
- Check database name matches: `solar-inventory-tracker-db`

### "Session not persisting"?

- Verify KV namespace binding (`SESSIONS`)
- Check SESSION_SECRET is set

### File uploads failing?

- Verify R2 bucket binding (`UPLOADS`)
- Check bucket name: `solar-inventory-uploads`

---

## 🔍 Worker Logs

View real-time logs:
1. Go to your Worker page
2. Click **Logs** tab
3. Try logging in - you'll see all requests

---

## 📝 Next Steps

1. ✅ Test all functionality (login, repairs, uploads)
2. ✅ Change admin password
3. ✅ Add more users/data
4. ✅ Connect frontend
5. ✅ Monitor logs for errors

---

## 🎉 Success Checklist

- [ ] D1 database created
- [ ] Migrations executed (tables created)
- [ ] KV namespace created
- [ ] R2 bucket created
- [ ] Worker deployed
- [ ] D1 binding configured
- [ ] KV binding configured
- [ ] R2 binding configured
- [ ] Secrets set (SESSION_SECRET, OPENAI keys)
- [ ] `/health` returns 200 OK
- [ ] Login works (admin/admin)
- [ ] Frontend connected

**All checked? You're done! 🚀**

---

## 📚 Additional Resources

- D1 Docs: https://developers.cloudflare.com/d1/
- Workers Docs: https://developers.cloudflare.com/workers/
- R2 Docs: https://developers.cloudflare.com/r2/

---

## 🆘 Need Help?

If you encounter issues:
1. Check Worker logs
2. Verify all bindings are configured
3. Check D1 Console for data
4. Review this guide step-by-step

The deployment is straightforward - most issues are from missing bindings or secrets!
