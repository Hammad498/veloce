#!/usr/bin/env bash
# Test the webhook endpoint with HMAC signature
# Usage: ./scripts/test-webhook.sh [base_url]

BASE_URL="${1:-http://localhost:3000}"
SECRET="${WEBHOOK_SECRET:-your-webhook-secret}"

PAYLOAD='{
  "title": "E-commerce Platform for Artisan Goods",
  "description": "We need a full e-commerce solution for selling handmade jewelry. Requirements: product catalog with variants (size/color), Stripe payment integration, order management dashboard, email notifications for order status, inventory tracking, discount codes, customer accounts with order history, and a mobile-responsive storefront. We expect around 500 products and 100 orders/day at peak.",
  "budgetRange": "15k-50k",
  "urgency": "1-3-months",
  "contactName": "Emma Wilson",
  "contactEmail": "emma@artisanmarket.co"
}'

SIG="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

echo "Testing webhook at $BASE_URL/api/webhooks/intake"
echo "Signature: $SIG"
echo ""

curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST "$BASE_URL/api/webhooks/intake" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIG" \
  -d "$PAYLOAD" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Test with bad signature (should return 401):"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST "$BASE_URL/api/webhooks/intake" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalidsignature" \
  -d "$PAYLOAD"
