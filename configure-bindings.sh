#!/bin/bash

# Automated Cloudflare Pages Bindings Configuration Script
# This script uses the Cloudflare API to configure D1, KV, and AI bindings

set -e

echo "🔧 Cloudflare Pages Bindings Configuration Script"
echo "=================================================="
echo ""

# Configuration
ACCOUNT_ID="fba2eb8c1f67996b268a0f108405f6ae"
PROJECT_NAME="solar-inventory-tracker"
D1_DATABASE_ID="d1172e52-4911-4bb5-aa89-5031fee8146d"
KV_NAMESPACE_ID="c0f9c485f4a342988efac7433605d281"

# Check if wrangler is logged in
echo "✓ Checking wrangler authentication..."
if ! npx wrangler whoami &>/dev/null; then
    echo "❌ Error: wrangler is not authenticated"
    echo "Please run: npx wrangler login"
    exit 1
fi
echo "✓ Wrangler authenticated"
echo ""

# Get API token from user
echo "📝 To configure bindings via API, we need your Cloudflare API token."
echo ""
echo "How to get your API token:"
echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "2. Click 'Create Token'"
echo "3. Use template: 'Edit Cloudflare Workers' or create custom with:"
echo "   - Account > Cloudflare Pages > Edit"
echo "   - Account > D1 > Edit"
echo "4. Copy the token"
echo ""
read -sp "Paste your Cloudflare API Token: " API_TOKEN
echo ""
echo ""

if [ -z "$API_TOKEN" ]; then
    echo "❌ No API token provided. Exiting."
    exit 1
fi

echo "✓ API token received"
echo ""

# Test API token
echo "🔍 Testing API token..."
TEST_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json")

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    echo "✓ API token is valid"
else
    echo "❌ API token validation failed"
    echo "$TEST_RESPONSE" | jq '.' || echo "$TEST_RESPONSE"
    exit 1
fi
echo ""

# Configure Production Environment Bindings
echo "⚙️  Configuring Production environment bindings..."
echo ""

# Prepare bindings JSON
BINDINGS_JSON=$(cat <<EOF
{
  "deployment_configs": {
    "production": {
      "d1_databases": {
        "DB": {
          "id": "$D1_DATABASE_ID"
        }
      },
      "kv_namespaces": {
        "SESSIONS": {
          "namespace_id": "$KV_NAMESPACE_ID"
        }
      },
      "ai_bindings": {
        "AI": {}
      }
    }
  }
}
EOF
)

echo "📤 Sending configuration to Cloudflare API..."
RESPONSE=$(curl -s -X PATCH \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$BINDINGS_JSON")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Production bindings configured successfully!"
    echo ""
    echo "Configured bindings:"
    echo "  • D1 Database: DB → solar-inventory-db"
    echo "  • KV Namespace: SESSIONS → $KV_NAMESPACE_ID"
    echo "  • Workers AI: AI"
else
    echo "❌ Failed to configure bindings"
    echo "Response:"
    echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
    echo ""
    echo "You may need to configure manually via dashboard."
    exit 1
fi
echo ""

# Ask about Preview environment
read -p "Configure bindings for Preview environment too? (y/n): " CONFIGURE_PREVIEW

if [ "$CONFIGURE_PREVIEW" = "y" ] || [ "$CONFIGURE_PREVIEW" = "Y" ]; then
    echo ""
    echo "⚙️  Configuring Preview environment bindings..."

    PREVIEW_BINDINGS_JSON=$(cat <<EOF
{
  "deployment_configs": {
    "preview": {
      "d1_databases": {
        "DB": {
          "id": "$D1_DATABASE_ID"
        }
      },
      "kv_namespaces": {
        "SESSIONS": {
          "namespace_id": "$KV_NAMESPACE_ID"
        }
      },
      "ai_bindings": {
        "AI": {}
      }
    }
  }
}
EOF
)

    PREVIEW_RESPONSE=$(curl -s -X PATCH \
        "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "$PREVIEW_BINDINGS_JSON")

    if echo "$PREVIEW_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Preview bindings configured successfully!"
    else
        echo "⚠️  Preview bindings configuration may have failed"
    fi
fi
echo ""

# Trigger redeployment
echo "🔄 Triggering redeployment..."
echo ""
read -p "Redeploy latest build to activate bindings? (y/n): " REDEPLOY

if [ "$REDEPLOY" = "y" ] || [ "$REDEPLOY" = "Y" ]; then
    echo ""
    echo "Deploying..."
    npm run build
    npm run deploy
    echo ""
    echo "✅ Redeployment complete!"
fi
echo ""

# Verification
echo "=========================================="
echo "✅ Configuration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test login at: https://production.solar-inventory-tracker.pages.dev/login"
echo "   - Username: admin"
echo "   - Password: admin"
echo ""
echo "2. Create a test component to verify database persistence"
echo ""
echo "3. Test AI features (if configured):"
echo "   - Look for chatbot icon in bottom-right"
echo "   - Ask a question to test AI"
echo ""
echo "4. Review full testing guide: COMPLETE-SETUP-SUMMARY.md"
echo ""
