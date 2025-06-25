#!/bin/bash

echo "🚀 Setting up NextAuth Authentication for Zenith Platform..."

# Install dependencies
echo "📦 Installing authentication dependencies..."
npm install @next-auth/prisma-adapter@^1.0.7 @prisma/client@^5.7.0 bcryptjs@^2.4.3 next-auth@^4.24.5

# Install dev dependencies
echo "📦 Installing development dependencies..."
npm install --save-dev @types/bcryptjs@^2.4.6 prisma@^5.7.0

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Please configure your database connection string in .env"
  echo "   Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/zenith_db\""
else
  echo "📊 Pushing database schema..."
  npx prisma db push
  
  echo "🌱 Seeding database with demo user..."
  npm run db:seed
fi

# Verify authentication setup
echo "✅ Verifying authentication setup..."
node scripts/verify-auth.js

echo ""
echo "🎉 NextAuth setup complete! Next steps:"
echo "   1. Configure DATABASE_URL in .env if not already done"
echo "   2. Configure Google OAuth credentials (optional):"
echo "      - GOOGLE_CLIENT_ID"
echo "      - GOOGLE_CLIENT_SECRET"
echo "   3. Start development server: npm run dev"
echo "   4. Visit http://localhost:3000/auth/signin to test"
echo ""
echo "🔑 Demo credentials:"
echo "   Email: zenithfresh25@gmail.com"
echo "   Password: F^bf35(llm1120!2a"