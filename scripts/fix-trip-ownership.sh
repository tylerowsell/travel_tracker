#!/bin/bash

# Helper script to transfer trip ownership from dev-user-sub to a real user
# Usage: ./fix-trip-ownership.sh <user-sub>

if [ -z "$1" ]; then
    echo "Usage: ./fix-trip-ownership.sh <user-sub>"
    echo "Example: ./fix-trip-ownership.sh 76dd3007-4bea-47c2-bed0-bee4ed13e48f"
    exit 1
fi

USER_SUB="$1"
API_URL="${API_URL:-http://localhost:8000}"

echo "Transferring trip ownership from 'dev-user-sub' to '$USER_SUB'..."
echo "API URL: $API_URL"
echo ""

response=$(curl -s -X POST "$API_URL/trips/fix-ownership" \
  -H "x-user-sub: $USER_SUB" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
echo ""
echo "Done! Please restart your backend and refresh your browser."
