#!/bin/bash

# Verification script for AI Chatbot D1 Database Access
# Usage: ./verify-db-chat.sh [BASE_URL]
# Default BASE_URL is http://localhost:8788 (local wrangler dev)

BASE_URL="${1:-http://localhost:8788}"

echo "🔍 Verifying AI Chatbot Database Access on: $BASE_URL"
echo ""

# Test 1: General Context (Recent Repairs)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Testing General Context (Recent Repairs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Sending message: 'What are the recent repairs?'"
response=$(curl -s -X POST "$BASE_URL/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the recent repairs?"
  }')

echo "Response:"
echo "$response" | jq '.' || echo "$response"

# Check if context_used is true
if echo "$response" | grep -q '"context_used": true'; then
  echo "✅ SUCCESS: Database context was used!"
else
  echo "⚠️  WARNING: Database context might not have been used (or no repairs found)."
fi

echo ""
echo ""

# Test 2: Specific Search (Mock Token)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testing Specific Search (Mock Token)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Sending message: 'Status of repair ABC12345'"
response=$(curl -s -X POST "$BASE_URL/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of repair ABC12345?"
  }')

echo "Response:"
echo "$response" | jq '.' || echo "$response"

echo ""
echo "✅ Verification Script Complete"
