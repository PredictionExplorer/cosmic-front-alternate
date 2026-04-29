#!/bin/bash 

set -e

DOMAIN="blackepolia.cosmicsignature.com"

echo "🚀 Deploying to Vercel (Preview)..."

# Run deploy and capture output
DEPLOY_OUTPUT=$(vercel --target preview)

echo "$DEPLOY_OUTPUT"

# Extract deployment URL (first https://*.vercel.app match)
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -n 1)

if [ -z "$DEPLOY_URL" ]; then
	echo "❌ Failed to extract deployment URL"
	exit 1
fi

echo "🔗 Deployment URL: $DEPLOY_URL"

echo "🌐 Assigning domain $DOMAIN ..."

vercel alias set "$DEPLOY_URL" "$DOMAIN"

echo "✅ Done! $DOMAIN → $DEPLOY_URL"
