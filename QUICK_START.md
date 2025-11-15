# 🚀 Quick Start - Deploy to Cloudflare (Free Tier)

**Total Time: ~20 minutes**

---

## 📋 What You Need

1. ✅ Cloudflare account (free) - https://dash.cloudflare.com
2. ✅ Worker code built - `dist-worker/index.js` (already done!)
3. ✅ Neon database URL
4. ✅ OpenAI credentials (see below)

---

## 🎯 Deployment Steps

### 1️⃣ Create KV Namespace (2 min)

**Dashboard**: https://dash.cloudflare.com → Workers & Pages → KV

- Click "Create a namespace"
- Name: `SESSIONS`
- Click "Add"
- **📋 Copy the Namespace ID**

---

### 2️⃣ Create R2 Bucket (2 min)

**Dashboard**: https://dash.cloudflare.com → R2

- Click "Create bucket"
- Name: `solar-inventory-uploads`
- Click "Create bucket"

---

### 3️⃣ Create & Deploy Worker (5 min)

**Dashboard**: https://dash.cloudflare.com → Workers & Pages → Create

1. Click **Create** → **Workers** → **Create Worker**
2. Name: `solar-inventory-tracker-api`
3. Click **Deploy**
4. Click **Edit Code**
5. **Copy contents from** `dist-worker/index.js`
6. Paste into editor (replace all)
7. Click **Deploy**

**📋 Copy your Worker URL:**
```
https://solar-inventory-tracker-api.YOUR_SUBDOMAIN.workers.dev
```

---

### 4️⃣ Configure Bindings (3 min)

**Worker Page** → Settings → Variables and Secrets

#### KV Namespace Binding:
- Variable name: `SESSIONS`
- KV namespace: Select `SESSIONS`
- Click "Save"

#### R2 Bucket Binding:
- Variable name: `UPLOADS`
- R2 bucket: Select `solar-inventory-uploads`
- Click "Save"

---

### 5️⃣ Set Environment Secrets (5 min)

**Still in Settings** → Variables and Secrets → Add variable

| Variable Name | Type | Value |
|---------------|------|-------|
| `DATABASE_URL` | Secret | Your Neon PostgreSQL URL |
| `SESSION_SECRET` | Secret | Any random 32+ char string |
| `OPENAI_API_KEY` | Secret | `sk-QUq6LniC21EVlKeJ97611786Db48400bB687Df84Af117b0c` |
| `OPENAI_API_BASE` | Secret | `https://api.laozhang.ai/v1` |

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```
Or use: `$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)`

Click **Save and Deploy** after each.

---

### 6️⃣ Test Your Worker (2 min)

**Test health endpoint:**
```
https://YOUR_WORKER_URL/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-15T...","environment":"production"}
```

**Test login:**
```bash
curl -X POST https://YOUR_WORKER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

✅ Should return user data!

---

### 7️⃣ Connect Frontend (5 min)

**Update Cloudflare Pages environment variable:**

1. Go to **Workers & Pages**
2. Find your Pages deployment
3. Settings → Environment variables
4. Add:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR_WORKER_URL`
   - Environment: Production
5. Redeploy frontend

---

## ✅ You're Live!

Your full-stack app is now running on Cloudflare's free tier:

- ✅ Frontend: Cloudflare Pages
- ✅ Backend: Cloudflare Workers
- ✅ Database: Neon PostgreSQL
- ✅ Files: Cloudflare R2
- ✅ Sessions: Cloudflare KV
- ✅ AI: OpenAI

---

## 📦 Key Files & Info

**Worker Code:**
```
/home/user/SolarInventoryTracker/dist-worker/index.js
```

**OpenAI Credentials:**
- API Key: `sk-QUq6LniC21EVlKeJ97611786Db48400bB687Df84Af117b0c`
- API Base: `https://api.laozhang.ai/v1`

**Frontend:**
```
https://41529b97.solar-inventory-tracker.pages.dev
```

**Detailed Guide:**
- Full instructions: `DASHBOARD_DEPLOYMENT.md`
- CLI reference: `CLOUDFLARE_DEPLOYMENT.md`

---

## 💰 Free Tier Limits

You're well within limits:

| Resource | Free Limit | Your Usage |
|----------|------------|------------|
| Workers Requests | 100K/day | ~1K/day ✓ |
| Worker Size | 1 MB | 744 KB ✓ |
| KV Reads | 100K/day | ~5K/day ✓ |
| R2 Storage | 10 GB | <1 GB ✓ |

---

## 🐛 Common Issues

**"Failed to fetch"**
→ Check CORS in worker code (line 24)

**"Authentication required"**
→ Check SESSION_SECRET is set
→ Verify KV binding

**"Database error"**
→ Verify DATABASE_URL format
→ Should include `?sslmode=require`

---

## 🎉 Success Checklist

- [ ] KV namespace created
- [ ] R2 bucket created
- [ ] Worker deployed
- [ ] Bindings configured
- [ ] Secrets set
- [ ] `/health` returns 200
- [ ] Login works
- [ ] Frontend connected

**All checked? You're done! 🚀**

---

**Need help?** Open `DASHBOARD_DEPLOYMENT.md` for detailed step-by-step guide!
