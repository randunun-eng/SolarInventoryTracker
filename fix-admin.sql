-- Fix Admin User Password
-- Run this SQL in your Neon database console

-- First, let's see what users exist
SELECT id, username, role,
       CASE
         WHEN password LIKE '$2%' THEN 'Hashed'
         ELSE 'Plain text (PROBLEM!)'
       END as password_status
FROM users;

-- Delete existing admin user if exists (optional, only if you want a fresh start)
-- DELETE FROM users WHERE username = 'admin';

-- Create or update admin user with bcryptjs hashed password for 'admin'
-- This hash is for the password: 'admin' (generated with bcryptjs)
INSERT INTO users (username, password, role)
VALUES ('admin', '$2b$10$BzpQih.dfmOhQyxaj2dKp.N4d2PaD8YuhTyxQC4/3ROuTBc7CrV/K', 'Admin')
ON CONFLICT (username)
DO UPDATE SET password = '$2b$10$BzpQih.dfmOhQyxaj2dKp.N4d2PaD8YuhTyxQC4/3ROuTBc7CrV/K',
              role = 'Admin';

-- Create test user (optional)
-- Password: 'test123' (generated with bcryptjs)
INSERT INTO users (username, password, role)
VALUES ('test', '$2b$10$raUjFCmKhBxHuVT0.qo3pu0Jyx8vO0H41UPdAJj.mDIUI.sQu.SUi', 'Technician')
ON CONFLICT (username)
DO UPDATE SET password = '$2b$10$raUjFCmKhBxHuVT0.qo3pu0Jyx8vO0H41UPdAJj.mDIUI.sQu.SUi',
              role = 'Technician';

-- Verify the update
SELECT id, username, role,
       SUBSTRING(password, 1, 10) || '...' as password_preview
FROM users
ORDER BY id;
