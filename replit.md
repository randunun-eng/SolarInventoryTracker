# ElectroTrack - Solar Inverter Repair Management System

## Overview
ElectroTrack is a comprehensive inventory and repair management system specifically designed for solar inverters. It features repair tracking, component management, client information, photo attachments, progress updates with date/time tracking, and PDF report generation.

## Project Architecture
- **Frontend**: React 18.x + Vite + Shadcn UI + TailwindCSS
- **Backend**: Express.js + Node.js 20.x
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM

## Important Configuration Notes

### Currency Settings
**IMPORTANT: Currency changes are SYMBOL-ONLY and do NOT convert existing values**

The currency setting in Settings → General Settings controls only the display symbol (e.g., $, €, £, Rs). When you change the currency:
- ✅ Display symbols update throughout the application (component prices, labor rates, etc.)
- ❌ Existing price values in the database DO NOT change
- ❌ No automatic currency conversion occurs

**Current Currency Configuration:**
- **Current Currency**: LKR (Sri Lankan Rupee - Rs)
- **Data Entry History**:
  - Initial data may have been entered with USD ($) symbol displayed
  - All prices should be treated as LKR values regardless of the symbol shown when entered
  - Moving forward, all new prices entered will display with Rs symbol

**Best Practice:**
When entering prices, always enter the value in your local currency (LKR). The system will display the correct symbol based on your currency settings.

### Database Schema
The application uses Drizzle ORM for database management. Key tables include:
- `components` - Electronic component inventory
- `repairs` - Repair job tracking (includes `tracking_token` field for customer tracking)
- `clients` - Customer information
- `inverters` - Solar inverter device records
- `fault_types` - Categorization of repair issues
- `used_components` - Components used in repairs
- `settings` - Application-wide configuration (including currency)

### Database Migrations
- **DO NOT** manually write SQL migrations
- Use `npm run db:push` to sync schema changes
- If errors occur, use `npm run db:push --force` to force sync
- NEVER change primary key ID column types (breaks existing data)

## Key Features
1. **Inventory Management**: Track electronic components with stock levels, suppliers, and pricing
2. **Repair Tracking**: Comprehensive repair workflow from received to completed
3. **Client Management**: Store customer information and history
4. **Progress Updates**: Real-time updates with photo attachments
5. **PDF Reports**: Generate detailed repair reports with embedded photos
6. **Customer Tracking**: Public shareable links for customers to track repair status without login
7. **Settings Management**: Configure currency, tax rates, labor rates, and notifications
8. **User Authentication**: Session-based authentication with bcrypt password hashing and role-based access

## Recent Changes
- **Role-Based Access Control System** (2025-11-15)
  - Implemented comprehensive RBAC with two user roles: Admin and Technician
  - Backend: Applied requireRole(['Admin']) middleware for admin-only operations
  - Backend: Applied requireAuth middleware for shared operations
  - Frontend: Enhanced ProtectedRoute component with requiredRoles prop
  - Frontend: Role-based login redirect (Technician → /repairs, Admin → /dashboard)
  - Frontend: Sidebar filtered by role (Technicians see only "Repair Logs")
  - Frontend: UI buttons conditionally rendered by role (Edit/Delete hidden for Technicians)
  - Technicians can: view repairs, update status, add progress, record components, generate PDFs
  - Technicians cannot: create/delete repairs, access inventory/settings/users pages
  - All tests passed - no 403 errors in Technician workflow
- **User Authentication System** (2025-11-15)
  - Implemented session-based authentication using Passport.js LocalStrategy
  - Added bcrypt password hashing (10 salt rounds) for secure password storage
  - Created authentication endpoints: /api/auth/login, /api/auth/logout, /api/auth/me
  - Built login page with form validation and error handling
  - Added AuthProvider using TanStack Query for global auth state management
  - Protected all application routes (redirect to login if not authenticated)
  - Made user profile dynamic in top navigation (shows name, role, logout)
  - Migrated existing users from plain-text to hashed passwords
  - Default users: admin/admin (Admin role), test/test123 (Technician role)
- **Customer Repair Tracking Feature** (2025-11-15)
  - Added tracking_token field to repairs table for unique shareable links
  - Created public tracking endpoint: GET /api/track/:token (no authentication required)
  - Built customer-facing tracking page at /track/:token showing repair status, history, and details
  - Added "Copy Tracking Link" button to repair detail modal for staff to share with customers
  - Automatically generates tracking tokens for all new repairs
  - Backfilled tracking tokens for 13 existing repairs
- Added LKR (Sri Lankan Rupee) to currency dropdown (2025-01-15)
- Fixed database parameter handling for Neon database (2025-01-15)
- Created settings table in database (2025-01-15)
- Implemented dynamic currency symbols throughout the application (2025-01-15)
- Optimized image resolution in PDF reports while maintaining full visibility (2025-01-15)

## Development Notes
- PDF reports use browser-native print functionality with HTML templates
- Image optimization: 120px screen view, 80px print view with object-fit: contain
- Currency symbols are mapped in both settings.tsx and component-form.tsx
- Settings are stored as JSONB in the database for flexibility
- **Role-Based Access Control**:
  - Backend: requireRole(['Admin']) middleware for admin-only routes
  - Backend: requireAuth middleware for shared routes
  - Backend: Technicians have read access to support data (components, categories, suppliers, clients, inverters, fault-types)
  - Backend: Technicians can update repairs, add progress, and record component usage
  - Backend: Only Admins can create/delete repairs and modify inventory/settings
  - Frontend: ProtectedRoute component with requiredRoles prop
  - Frontend: Role-based login redirect via ROLE_DEFAULT_ROUTES mapping
  - Frontend: Sidebar filtered by role (Technicians see only "Repair Logs")
  - Frontend: UI buttons conditionally rendered by role
  - Frontend: Access Denied (403) page for unauthorized access attempts
  - Login redirect: Admin → /dashboard, Technician → /repairs, Unknown → /repairs (safe fallback)
- **Authentication System**:
  - Session-based auth with express-session + Passport.js LocalStrategy
  - Passwords hashed using bcrypt (10 salt rounds)
  - AuthProvider manages global auth state via TanStack Query
  - ProtectedRoute component wraps all authenticated routes
  - Public routes: /login, /track/:token (no auth required)
  - User roles: Admin, Technician (extensible via ROLE_DEFAULT_ROUTES mapping)
  - Auth endpoints: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- **Customer Tracking Links**: 
  - Unique 16-character hex tokens generated via crypto.randomBytes(8)
  - Public endpoint returns only customer-facing data (no pricing, technician notes, or internal metadata)
  - Tracking page route (/track/:token) is outside the authenticated layout
  - TanStack Query queryKey must include full URL path: `[/api/track/${token}]` not `["/api/track", token]`

## File Structure
- `/client` - React frontend application
- `/server` - Express.js backend
- `/shared` - Shared TypeScript types and schemas (Drizzle)
- `/attached_assets` - User-uploaded files and generated images

## Important Reminders
- Always use the correct currency when entering prices (currently LKR)
- Settings changes require page refresh to take effect
- Database backups should be performed regularly
- Test PDF generation after major changes
