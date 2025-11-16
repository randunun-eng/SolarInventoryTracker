# Fix 522 Error for eurovolt.store

## Problem
The domain `eurovolt.store` has A records but they're not pointing to your Pages project, causing a 522 Connection Timed Out error.

## Solution: Update DNS Records

### Option 1: Add Domain via Pages Dashboard (Recommended)

1. **Go to Pages Custom Domains**
   - URL: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae/pages/view/solar-inventory-tracker
   - Click **"Custom domains"** tab
   - Click **"Set up a custom domain"**

2. **Add the Domain**
   - Enter: `eurovolt.store`
   - Click **"Continue"** or **"Activate domain"**
   - Cloudflare will AUTOMATICALLY update DNS for you

3. **Wait 1-2 minutes** for activation

### Option 2: Manual DNS Configuration

If the above doesn't work, manually update DNS:

1. **Go to DNS Management**
   - URL: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae/eurovolt.store/dns

2. **Delete Existing A Records**
   - Find the A record for `eurovolt.store` (104.21.70.157 and 172.67.168.104)
   - Click the three dots → **"Delete"**
   - Do this for BOTH A records

3. **Add CNAME Record**
   ```
   Type: CNAME
   Name: @
   Target: solar-inventory-tracker.pages.dev
   Proxy status: Proxied (orange cloud ☁️)
   TTL: Auto
   ```
   - Click **"Save"**

4. **Add www CNAME (Optional)**
   ```
   Type: CNAME
   Name: www
   Target: solar-inventory-tracker.pages.dev
   Proxy status: Proxied (orange cloud ☁️)
   TTL: Auto
   ```

### Verification

After making changes, wait 1-2 minutes, then test:

```bash
# Check DNS
dig eurovolt.store

# Test HTTPS
curl -I https://eurovolt.store

# Should return HTTP/2 200 instead of 522
```

## Why This Happens

The A records (104.21.70.157, 172.67.168.104) are generic Cloudflare IPs that don't know about your Pages project. The CNAME record tells Cloudflare to route traffic to your specific Pages deployment.

## Expected Result

After fixing:
- `https://eurovolt.store` → Your Solar Inventory Tracker
- All APIs work: `/api/auth/login`, `/api/components`, etc.
- Free SSL certificate (automatic)
- Both `eurovolt.store` and `solar-inventory-tracker.pages.dev` work

## Quick Links

- **Pages Dashboard**: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae/pages/view/solar-inventory-tracker
- **DNS Management**: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae/eurovolt.store/dns
- **Account Dashboard**: https://dash.cloudflare.com/fba2eb8c1f67996b268a0f108405f6ae
