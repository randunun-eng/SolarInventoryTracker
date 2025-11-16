#!/bin/bash

# AI Features Test Script
# Tests all AI endpoints on the deployed application

BASE_URL="${1:-https://ai-enabled.solar-inventory-tracker.pages.dev}"

echo "🤖 Testing AI Features on: $BASE_URL"
echo ""

# Test 1: AI Chat
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Testing AI Chat Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$BASE_URL/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is a solar inverter?",
    "context": {
      "totalComponents": 10
    }
  }' 2>/dev/null | jq '.'

echo ""
echo ""

# Test 2: Component Analysis
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testing Component Analysis Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$BASE_URL/api/analyze-component" \
  -H "Content-Type: application/json" \
  -d '{
    "component": {
      "name": "Solar Panel 400W",
      "partNumber": "SP-400-M",
      "category": "Solar Panels",
      "description": "400W monocrystalline panel"
    }
  }' 2>/dev/null | jq '.'

echo ""
echo ""

# Test 3: Stats with AI Insights (will fail until D1 has data)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Testing Stats with AI Insights"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "(Note: Requires D1 binding and data)"
curl "$BASE_URL/api/stats?insights=true" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.'

echo ""
echo ""
echo "✅ AI Features Test Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Configure AI binding in Cloudflare dashboard"
echo "2. See AI-FEATURES-SETUP.md for detailed instructions"
echo ""
