#!/bin/bash
echo "Starting Vercel build..."
echo "Current directory: $(pwd)"
echo "Package name: $(grep '"name"' package.json)"

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build the project
echo "Building Next.js project..."
npm run build

echo "Build complete!"