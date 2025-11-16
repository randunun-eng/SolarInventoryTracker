# Custom Domain Setup for Solar Inventory Tracker

## Domain: eurovolt.store

### Method 1: Using Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae/pages/view/solar-inventory-tracker
   - Or navigate to: **Pages** → **solar-inventory-tracker** → **Custom domains**

2. **Add Custom Domain**
   - Click **"Set up a custom domain"** or **"+ Add a custom domain"**
   - Enter: `eurovolt.store`
   - Click **"Continue"**
   - Cloudflare will automatically configure the DNS records

3. **Add www subdomain (Optional)**
   - Click **"+ Add a custom domain"** again
   - Enter: `www.eurovolt.store`
   - Click **"Continue"**

4. **Wait for SSL Certificate**
   - SSL certificate will be automatically provisioned (usually takes 1-5 minutes)
   - Status will change from "Pending" to "Active"

### Method 2: Manual DNS Configuration

If you prefer to manually configure DNS:

1. **Add CNAME Record**
   ```
   Type: CNAME
   Name: @ (or eurovolt.store)
   Target: solar-inventory-tracker.pages.dev
   Proxy: Enabled (Orange cloud)
   TTL: Auto
   ```

2. **Add www CNAME Record (Optional)**
   ```
   Type: CNAME
   Name: www
   Target: solar-inventory-tracker.pages.dev
   Proxy: Enabled (Orange cloud)
   TTL: Auto
   ```

### Verification

After adding the domain, verify it's working:

```bash
# Check DNS propagation
dig eurovolt.store

# Test HTTPS
curl -I https://eurovolt.store

# Test API endpoint
curl https://eurovolt.store/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

### Expected Results

Once configured:
- Primary: https://eurovolt.store
- WWW: https://www.eurovolt.store
- Original: https://solar-inventory-tracker.pages.dev (still works)

All domains will have:
- Free SSL certificate (Let's Encrypt)
- Automatic HTTPS redirect
- Cloudflare CDN and DDoS protection
- Same APIs and functionality

## Troubleshooting

### SSL Certificate Pending
- Wait 5-10 minutes for certificate provisioning
- Check that domain is in your Cloudflare account
- Ensure DNS proxy (orange cloud) is enabled

### Domain Not Resolving
- Wait for DNS propagation (up to 24 hours, usually 5 minutes)
- Clear browser cache
- Try incognito/private browsing mode

### API Not Working
- Check CORS settings (already configured for *)
- Verify the session tokens are being passed correctly
- Check browser console for errors

## Current Setup

- **Project**: solar-inventory-tracker
- **Account ID**: fba2eb8c1f67996b268a0f108405f6ae
- **Default Domain**: solar-inventory-tracker.pages.dev
- **Custom Domain**: eurovolt.store (to be added)

## Next Steps

1. Add the custom domain via dashboard (5 minutes)
2. Wait for SSL certificate (1-5 minutes)
3. Test the new domain
4. Update your frontend configuration to use eurovolt.store
5. (Optional) Set up redirects from pages.dev to custom domain
