# Cloudflare Workers Deployment Guide

This guide explains how to deploy the ElectroTrack backend API to Cloudflare Workers.

## Architecture

- **Frontend**: Cloudflare Pages (already deployed at https://41529b97.solar-inventory-tracker.pages.dev)
- **Backend API**: Cloudflare Workers (Hono framework)
- **Database**: Neon PostgreSQL (existing)
- **File Storage**: Cloudflare R2
- **Session Storage**: Cloudflare KV
- **AI Service**: OpenAI API (custom endpoint)

## Prerequisites

1. Cloudflare account with Workers and Pages enabled
2. Wrangler CLI installed (`npm install -g wrangler`)
3. Neon PostgreSQL database (already set up)
4. OpenAI API credentials (provided)

## Step 1: Set Up Cloudflare Resources

### 1.1 Create KV Namespace for Sessions

```bash
# Create production KV namespace
wrangler kv:namespace create "SESSIONS"

# Create preview KV namespace for development
wrangler kv:namespace create "SESSIONS" --preview
```

**Note the IDs** returned and update them in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_PRODUCTION_KV_ID"
preview_id = "YOUR_PREVIEW_KV_ID"
```

### 1.2 Create R2 Bucket for File Uploads

```bash
# Create production R2 bucket
wrangler r2 bucket create solar-inventory-uploads

# Create preview bucket for development
wrangler r2 bucket create solar-inventory-uploads-preview
```

The bucket names are already configured in `wrangler.toml`.

## Step 2: Configure Environment Variables

Set the required secrets using Wrangler:

```bash
# Database URL (your Neon PostgreSQL connection string)
wrangler secret put DATABASE_URL
# Enter your Neon database URL when prompted

# Session secret (generate a random string)
wrangler secret put SESSION_SECRET
# Enter a random string (e.g., use: openssl rand -base64 32)

# OpenAI API Key
wrangler secret put OPENAI_API_KEY
# Enter: sk-QUq6LniC21EVlKeJ97611786Db48400bB687Df84Af117b0c

# OpenAI API Base URL
wrangler secret put OPENAI_API_BASE
# Enter: https://api.laozhang.ai/v1
```

## Step 3: Build and Deploy the Worker

### 3.1 Build the Worker

```bash
npm run build:worker
```

This compiles the Worker code from `worker/index.ts` to `dist-worker/index.js`.

### 3.2 Deploy to Cloudflare

```bash
# Deploy to production
npm run deploy:worker

# Or use wrangler directly
wrangler deploy
```

### 3.3 Test the Deployment

After deployment, Wrangler will output a URL like:
```
https://solar-inventory-tracker-api.YOUR_SUBDOMAIN.workers.dev
```

Test the health endpoint:
```bash
curl https://solar-inventory-tracker-api.YOUR_SUBDOMAIN.workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T20:30:00.000Z",
  "environment": "production"
}
```

## Step 4: Connect Frontend to Worker API

Update the frontend to use the Worker API endpoint.

### 4.1 Find the Frontend API Configuration

The frontend likely has an API base URL configuration. Common locations:
- `client/src/lib/api.ts`
- `client/src/config.ts`
- Environment variables in Cloudflare Pages

### 4.2 Update API Base URL

Set the API base URL to your Worker endpoint:
```typescript
const API_BASE_URL = 'https://solar-inventory-tracker-api.YOUR_SUBDOMAIN.workers.dev';
```

Or configure it as a Cloudflare Pages environment variable:
```bash
# In Cloudflare dashboard:
# Settings → Environment variables → Production
VITE_API_URL=https://solar-inventory-tracker-api.YOUR_SUBDOMAIN.workers.dev
```

### 4.3 Configure CORS for Frontend Domain

Update `worker/index.ts` CORS configuration to allow your frontend domain:

```typescript
app.use('/*', cors({
  origin: 'https://41529b97.solar-inventory-tracker.pages.dev',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Set-Cookie'],
}));
```

## Step 5: Configure R2 Public Access (Optional)

To serve uploaded files publicly:

### Option 1: R2 Custom Domain
1. Go to Cloudflare Dashboard → R2 → your bucket
2. Click "Settings" → "Public Access"
3. Connect a custom domain (e.g., `uploads.yourdomain.com`)

### Option 2: Worker-based File Serving
Files are already served through the Worker at `/uploads/*` paths.

## Step 6: Database Migrations

Ensure your database schema is up to date:

```bash
npm run db:push
```

## Step 7: Test All Endpoints

Test key functionality:

```bash
# Test login
curl -X POST https://YOUR_WORKER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Test components endpoint (requires auth)
curl https://YOUR_WORKER_URL/api/components \
  -H "Cookie: sid=YOUR_SESSION_ID"

# Test AI chat
curl -X POST https://YOUR_WORKER_URL/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What components are low in stock?"}'
```

## Development Workflow

### Local Development

```bash
# Run the Worker locally with Wrangler
npm run dev:worker
```

This starts a local development server at `http://localhost:8787`.

### Testing with Local Frontend

Update frontend API URL to `http://localhost:8787` for local testing.

## Monitoring and Logs

### View Worker Logs

```bash
wrangler tail
```

### View Logs in Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your Worker
3. Click "Logs" tab

### Analytics

Workers analytics are available in the Cloudflare dashboard showing:
- Request count
- Error rate
- CPU time
- Success rate

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Check the `origin` setting in `worker/index.ts`
2. Ensure credentials are set to `true`
3. Verify the frontend is using the correct API URL

### Session Not Persisting

1. Verify KV namespace is correctly bound in `wrangler.toml`
2. Check that cookies are being sent with requests (`credentials: 'include'`)
3. Ensure the frontend and backend are on HTTPS (or both localhost)

### File Upload Errors

1. Verify R2 bucket is correctly bound in `wrangler.toml`
2. Check bucket permissions
3. Ensure file size is within limits (20MB default)

### Database Connection Errors

1. Verify `DATABASE_URL` secret is set correctly
2. Check Neon database is accessible from Cloudflare Workers
3. Verify SSL/TLS settings in connection string

### AI Service Errors

1. Verify `OPENAI_API_KEY` and `OPENAI_API_BASE` are set
2. Test the API credentials directly
3. Check API quota and rate limits

## Cost Optimization

### Workers
- Free tier: 100,000 requests/day
- Paid: $5/month for 10 million requests

### R2
- Free tier: 10GB storage, 1 million Class A operations/month
- Very cost-effective for file storage

### KV
- Free tier: 100,000 reads/day, 1,000 writes/day
- Paid: $0.50 per million reads

## Security Considerations

1. **Rotate Secrets Regularly**: Update `SESSION_SECRET` periodically
2. **Secure Database**: Ensure Neon database has proper authentication
3. **CORS Configuration**: Restrict to specific frontend domains in production
4. **Rate Limiting**: Consider adding rate limiting middleware
5. **Input Validation**: All inputs are validated using Zod schemas

## Production Checklist

- [ ] KV namespace created and configured
- [ ] R2 bucket created and configured
- [ ] All secrets set (DATABASE_URL, SESSION_SECRET, OPENAI_API_KEY, OPENAI_API_BASE)
- [ ] Worker deployed successfully
- [ ] Frontend connected to Worker API
- [ ] CORS configured for production domain
- [ ] Database schema up to date
- [ ] File uploads tested
- [ ] Authentication tested
- [ ] AI features tested
- [ ] Monitoring and logging enabled

## Custom Domain (Optional)

To use a custom domain for your Worker API:

1. Go to Workers & Pages → Your Worker → Settings → Domains & Routes
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Cloudflare will automatically configure DNS

Update frontend to use custom domain:
```typescript
const API_BASE_URL = 'https://api.yourdomain.com';
```

## Next Steps

1. Deploy the Worker following this guide
2. Update the frontend API configuration
3. Test all functionality end-to-end
4. Monitor logs and analytics
5. Set up alerts for errors and high usage

## Support

For issues with:
- **Cloudflare Workers**: Check [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- **Hono Framework**: Check [Hono documentation](https://hono.dev/)
- **Neon Database**: Check [Neon documentation](https://neon.tech/docs)
