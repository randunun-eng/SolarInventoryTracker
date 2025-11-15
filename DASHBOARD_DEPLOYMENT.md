# 🚀 Deploy via Cloudflare Dashboard (UI Method)

Since CLI authentication has proxy restrictions, let's deploy using the Cloudflare Dashboard instead!

## ✅ Prerequisites

- Cloudflare account (free tier is perfect!)
- Worker code already built: `dist-worker/index.js` (744KB ✓)
- Your Neon database URL
- OpenAI API credentials

---

## Step 1: Create KV Namespace (Session Storage) ⏱️ 2 minutes

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** in left sidebar
3. Click **KV** tab at the top
4. Click **Create a namespace** button
5. Enter name: `SESSIONS`
6. Click **Add**
7. **📋 COPY THE NAMESPACE ID** - looks like: `abc123...`
8. Keep this ID handy - you'll need it soon

---

## Step 2: Create R2 Bucket (File Storage) ⏱️ 2 minutes

1. In Cloudflare Dashboard, click **R2** in left sidebar
2. Click **Create bucket** button
3. Enter name: `solar-inventory-uploads`
4. Region: **Automatic** (optimized for free tier)
5. Click **Create bucket**
6. ✅ That's it for R2!

---

## Step 3: Create the Worker ⏱️ 3 minutes

1. Go back to **Workers & Pages**
2. Click **Create** button (top right)
3. Select **Workers** tab
4. Click **Create Worker**
5. Give it a name: `solar-inventory-tracker-api` (or your choice)
6. Click **Deploy** (we'll update the code next)
7. Your Worker URL will be: `https://solar-inventory-tracker-api.YOUR_SUBDOMAIN.workers.dev`
8. **📋 COPY THIS URL** - you'll need it for the frontend!

---

## Step 4: Upload Worker Code ⏱️ 2 minutes

1. On your Worker page, click **Edit Code** button (top right)
2. Delete all the default code in the editor
3. Open your local file: `dist-worker/index.js`
4. Copy **ALL** the contents
5. Paste it into the Cloudflare editor
6. Click **Deploy** button (top right)
7. ✅ Code deployed!

---

## Step 5: Configure Bindings ⏱️ 3 minutes

### 5.1 Add KV Namespace Binding

1. Click **Settings** tab
2. Click **Variables and Secrets** in the left menu
3. Scroll to **KV Namespace Bindings** section
4. Click **Add binding**
5. Variable name: `SESSIONS` (must match exactly)
6. KV namespace: Select `SESSIONS` from dropdown
7. Click **Save**

### 5.2 Add R2 Bucket Binding

1. Still in **Variables and Secrets**
2. Scroll to **R2 Bucket Bindings** section
3. Click **Add binding**
4. Variable name: `UPLOADS` (must match exactly)
5. R2 bucket: Select `solar-inventory-uploads` from dropdown
6. Click **Save**

---

## Step 6: Set Environment Variables & Secrets ⏱️ 5 minutes

Still in **Settings** → **Variables and Secrets**:

### Required Secrets (click "Add variable" for each):

1. **DATABASE_URL**
   - Type: Secret (encrypted)
   - Value: Your Neon PostgreSQL connection string
   - Example: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`

2. **SESSION_SECRET**
   - Type: Secret (encrypted)
   - Value: Any random string (32+ characters)
   - Generate one: Open terminal and run: `openssl rand -base64 32`
   - Or use: `your-super-secret-random-string-change-me-in-production`

3. **OPENAI_API_KEY**
   - Type: Secret (encrypted)
   - Value: `sk-QUq6LniC21EVlKeJ97611786Db48400bB687Df84Af117b0c`

4. **OPENAI_API_BASE**
   - Type: Secret (encrypted)
   - Value: `https://api.laozhang.ai/v1`

### Optional Variable:

5. **NODE_ENV** (Plain text variable)
   - Type: Text (not encrypted, optional)
   - Value: `production`

After adding each secret, click **Save and Deploy**

---

## Step 7: Test the Worker ⏱️ 2 minutes

### 7.1 Test Health Endpoint

Open in browser or use curl:
```
https://YOUR_WORKER_URL/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T21:00:00.000Z",
  "environment": "production"
}
```

### 7.2 Test API Endpoints

Try the login endpoint:
```bash
curl -X POST https://YOUR_WORKER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

✅ If you get user data back, it's working!

---

## Step 8: Connect Frontend to Worker ⏱️ 5 minutes

### 8.1 Update Frontend API Configuration

You need to update your frontend to point to the new Worker API. The configuration is likely in one of these files:

- `client/src/lib/api.ts`
- `client/src/config.ts`
- `client/src/lib/queryClient.ts`

Or as an environment variable in Cloudflare Pages.

### 8.2 Option A: Update Cloudflare Pages Environment Variable

1. Go to **Workers & Pages**
2. Find your Pages deployment: `solar-inventory-tracker`
3. Click **Settings** → **Environment variables**
4. Add variable:
   - Name: `VITE_API_URL` (or whatever your frontend uses)
   - Value: `https://YOUR_WORKER_URL`
   - Environment: Production
5. Click **Save**
6. Redeploy your Pages site

### 8.3 Option B: Direct Code Update

If you know where the API base URL is configured, update it directly:

```typescript
const API_BASE_URL = 'https://YOUR_WORKER_URL';
```

Then redeploy your frontend.

---

## Step 9: Update CORS for Production ⏱️ 2 minutes

To secure your Worker, update the CORS configuration:

1. Go back to **Edit Code** in your Worker
2. Find the CORS section (around line 24):
   ```typescript
   app.use('/*', cors({
     origin: (origin) => origin, // Allow all origins in development
   ```

3. Change to:
   ```typescript
   app.use('/*', cors({
     origin: 'https://41529b97.solar-inventory-tracker.pages.dev', // Your frontend URL
   ```

4. Click **Deploy**

---

## ✅ Deployment Complete!

Your full-stack application is now running on Cloudflare's free tier:

- ✅ **Frontend**: Cloudflare Pages
- ✅ **Backend API**: Cloudflare Workers
- ✅ **Database**: Neon PostgreSQL
- ✅ **File Storage**: Cloudflare R2
- ✅ **Session Storage**: Cloudflare KV
- ✅ **AI Service**: OpenAI (custom endpoint)

---

## 💰 Free Tier Limits

You're well within free tier limits:

| Resource | Free Tier | Your Usage (est.) |
|----------|-----------|-------------------|
| Workers Requests | 100,000/day | ~1,000/day |
| Worker Size | 1 MB | 744 KB ✓ |
| KV Reads | 100,000/day | ~5,000/day |
| KV Writes | 1,000/day | ~500/day |
| R2 Storage | 10 GB | <1 GB |
| Pages Bandwidth | Unlimited | ✓ |

---

## 🔍 Monitoring & Logs

### View Logs

1. Go to your Worker page
2. Click **Logs** tab (real-time)
3. Or click **Analytics** for historical data

### Check Usage

1. Go to **Workers & Pages**
2. Your Worker overview shows:
   - Request count
   - Error rate
   - CPU time
   - Success rate

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch" errors

**Solution**: Check CORS configuration in worker code

### Problem: "Authentication required" errors

**Solution**:
1. Check frontend is sending cookies (`credentials: 'include'`)
2. Verify SESSION_SECRET is set
3. Check KV namespace binding is correct

### Problem: "Database connection error"

**Solution**:
1. Verify DATABASE_URL is correct
2. Test connection from Neon dashboard
3. Ensure `?sslmode=require` is in connection string

### Problem: "File upload fails"

**Solution**:
1. Verify R2 bucket binding is correct
2. Check bucket name matches: `solar-inventory-uploads`
3. Ensure file size is under 20MB

---

## 🎯 Next Steps

1. ✅ Test all functionality (login, repairs, uploads, AI chat)
2. ✅ Update frontend API URL
3. ✅ Secure CORS for production
4. ✅ Monitor logs for any errors
5. ✅ Set up custom domain (optional)

---

## 🆘 Need Help?

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Hono Framework: https://hono.dev/
- Neon Database: https://neon.tech/docs

---

## 🎉 Success Checklist

- [ ] KV namespace created and bound
- [ ] R2 bucket created and bound
- [ ] Worker code uploaded
- [ ] All secrets configured
- [ ] Health endpoint returns 200 OK
- [ ] Login endpoint works
- [ ] Frontend connected to Worker
- [ ] CORS configured for production
- [ ] Tested file uploads
- [ ] Tested AI chat

**Once all checked, you're live! 🚀**
