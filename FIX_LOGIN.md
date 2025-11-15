# 🔧 Fix Login Issue

Your Worker is deployed but login isn't working because the database passwords need to be hashed with bcryptjs.

## Quick Fix (2 minutes)

### Option 1: Run SQL in Neon Console (Easiest!)

1. Go to your Neon database dashboard: https://console.neon.tech
2. Select your database
3. Click **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Create or update admin user
INSERT INTO users (username, password, role)
VALUES ('admin', '$2b$10$BzpQih.dfmOhQyxaj2dKp.N4d2PaD8YuhTyxQC4/3ROuTBc7CrV/K', 'Admin')
ON CONFLICT (username)
DO UPDATE SET
  password = '$2b$10$BzpQih.dfmOhQyxaj2dKp.N4d2PaD8YuhTyxQC4/3ROuTBc7CrV/K',
  role = 'Admin';

-- Create test user (optional)
INSERT INTO users (username, password, role)
VALUES ('test', '$2b$10$raUjFCmKhBxHuVT0.qo3pu0Jyx8vO0H41UPdAJj.mDIUI.sQu.SUi', 'Technician')
ON CONFLICT (username)
DO UPDATE SET
  password = '$2b$10$raUjFCmKhBxHuVT0.qo3pu0Jyx8vO0H41UPdAJj.mDIUI.sQu.SUi',
  role = 'Technician';
```

5. Click **Run**
6. ✅ Done! Now try logging in again

---

### Option 2: Run Fix Script (If you have DATABASE_URL)

If you have your `DATABASE_URL`:

```bash
export DATABASE_URL="your_neon_database_url_here"
npx tsx fix-admin-password.ts
```

---

## Test Login

After running the SQL:

**Try logging in with:**
- Username: `admin`
- Password: `admin`

**Or with test user:**
- Username: `test`
- Password: `test123`

---

## What Was Wrong?

The issue: Your Worker uses **bcryptjs** to hash passwords (browser-compatible), but your database might have:
- Plain text passwords
- Passwords hashed with Node.js bcrypt (incompatible with Workers)

The fix: We generated proper bcryptjs hashes that work with Cloudflare Workers.

---

## Password Hashes Used

For reference, these are the bcryptjs hashes:

**Admin (password: 'admin'):**
```
$2b$10$BzpQih.dfmOhQyxaj2dKp.N4d2PaD8YuhTyxQC4/3ROuTBc7CrV/K
```

**Test (password: 'test123'):**
```
$2b$10$raUjFCmKhBxHuVT0.qo3pu0Jyx8vO0H41UPdAJj.mDIUI.sQu.SUi
```

---

## Still Having Issues?

### Check Database Connection

In your Worker settings, verify `DATABASE_URL` is set correctly:
```
postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require
```

### Check Worker Logs

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your Worker
3. Click **Logs** tab
4. Try logging in and watch for errors

### Common Errors:

**"Invalid username or password"**
→ Run the SQL above to fix password hash

**"Database connection error"**
→ Check DATABASE_URL is correct in Worker settings

**"Not authenticated"**
→ Check SESSIONS KV binding is configured

**"CORS error"**
→ Check frontend is using correct Worker URL

---

## Need More Help?

Share:
1. Your Worker URL
2. Error message from browser console (F12)
3. Error from Worker logs

I'll help you debug!
