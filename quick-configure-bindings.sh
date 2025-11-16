#!/bin/bash

# Quick Bindings Configuration using Cloudflare API
# Usage: ./quick-configure-bindings.sh YOUR_API_TOKEN

API_TOKEN="$1"
ACCOUNT_ID="fba2eb8c1f67996b268a0f108405f6ae"
PROJECT_NAME="solar-inventory-tracker"

if [ -z "$API_TOKEN" ]; then
    echo "❌ Error: No API token provided"
    echo ""
    echo "Usage: $0 YOUR_API_TOKEN"
    echo ""
    echo "Get your API token:"
    echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Edit Cloudflare Workers' template"
    echo "4. Copy token and run: $0 <token>"
    exit 1
fi

echo "🔧 Configuring bindings for solar-inventory-tracker..."
echo ""

# Configure Production bindings
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "deployment_configs": {
      "production": {
        "d1_databases": {
          "DB": {
            "id": "d1172e52-4911-4bb5-aa89-5031fee8146d"
          }
        },
        "kv_namespaces": {
          "SESSIONS": {
            "namespace_id": "c0f9c485f4a342988efac7433605d281"
          }
        },
        "ai_bindings": {
          "AI": {}
        }
      }
    }
  }' | jq '.'

echo ""
echo "✅ Bindings configuration sent!"
echo ""
echo "Next: Redeploy to activate bindings:"
echo "  npm run build && npm run deploy"
