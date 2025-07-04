#!/bin/bash

echo "🚀 VERCEL DEPLOYMENT SCRIPT"
echo "============================"

# Set environment variables
export VERCEL_TOKEN="N5UFI8ZprlgY69oigubxRp6s"
export VERCEL_PROJECT_ID="prj_VykmodGYGRNYNjtfWft6yuhnlA7M"
export VERCEL_ORG_ID="team_hIVuEbN4ena7UPqg1gt1jb6s"

echo "📊 Project Information:"
echo "- Project ID: $VERCEL_PROJECT_ID"
echo "- Organization ID: $VERCEL_ORG_ID"
echo "- Domain: zenith.engineer"

echo ""
echo "🔧 Build Status:"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🚀 Starting deployment..."

# Create .vercel/project.json with correct configuration
mkdir -p .vercel
cat > .vercel/project.json << EOF
{
  "projectId": "$VERCEL_PROJECT_ID",
  "orgId": "$VERCEL_ORG_ID"
}
EOF

echo "📝 Configuration created"

# Deploy using curl API (alternative method)
echo ""
echo "🌐 Alternative API deployment method:"
echo "POST https://api.vercel.com/v13/deployments"
echo "Authorization: Bearer $VERCEL_TOKEN"

echo ""
echo "✅ Ready for deployment!"
echo ""
echo "MANUAL INSTRUCTIONS:"
echo "1. Run: VERCEL_TOKEN=$VERCEL_TOKEN npx vercel login"
echo "2. Run: npx vercel --prod"
echo "3. Or use GitHub: Configure token and push"