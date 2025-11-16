#!/bin/bash
# After creating D1 database in Cloudflare Dashboard,
# run this script to update wrangler.toml with your database ID

echo "================================================"
echo "D1 Database Setup Helper"
echo "================================================"
echo ""
echo "Step 1: Create D1 Database in Cloudflare Dashboard"
echo "-----------------------------------------------"
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Click: Workers & Pages → D1 SQL Database"
echo "3. Click: Create database"
echo "4. Enter name: solar-inventory-tracker-db"
echo "5. Click: Create"
echo ""
echo "Step 2: Get Your Database ID"
echo "-----------------------------------------------"
echo "After creating, you'll see something like:"
echo ""
echo "[[d1_databases]]"
echo "binding = \"DB\""
echo "database_name = \"solar-inventory-tracker-db\""
echo "database_id = \"abc123-def456-...\""
echo ""
echo "Step 3: Copy the database_id and paste it below"
echo "-----------------------------------------------"
echo ""
read -p "Enter your D1 database ID: " DB_ID

if [ -z "$DB_ID" ]; then
    echo "Error: Database ID cannot be empty"
    exit 1
fi

echo ""
echo "Updating wrangler.toml..."

# Update wrangler.toml with the database ID
sed -i "s/database_id = \"placeholder_database_id\"/database_id = \"$DB_ID\"/" wrangler.toml

echo "✅ Updated wrangler.toml with database ID: $DB_ID"
echo ""
echo "Next Steps:"
echo "-----------------------------------------------"
echo "1. Run migrations in D1 Console:"
echo "   - Go to your database in Cloudflare Dashboard"
echo "   - Click 'Console' tab"
echo "   - Copy/paste contents from migrations/0001_create_tables.sql"
echo "   - Click 'Execute'"
echo "   - Copy/paste contents from migrations/0002_seed_data.sql"
echo "   - Click 'Execute'"
echo ""
echo "2. Deploy your worker:"
echo "   - Copy contents from dist-worker/index.js"
echo "   - Paste into Worker editor in Cloudflare Dashboard"
echo ""
echo "3. Configure bindings (see D1_DEPLOYMENT_GUIDE.md)"
echo ""
echo "================================================"
