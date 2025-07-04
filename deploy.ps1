# Zenith Platform Deployment Script (PowerShell)
# This script handles the deployment process for the Zenith Platform

$ErrorActionPreference = "Stop"

Write-Host "Starting Zenith Platform Deployment..." -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

# Check if required tools are installed
try {
    node --version | Out-Null
} catch {
    Write-Host "Error: Node.js is not installed." -ForegroundColor Red
    exit 1
}

try {
    npm --version | Out-Null
} catch {
    Write-Host "Error: npm is not installed." -ForegroundColor Red
    exit 1
}

Write-Host "Environment checks passed" -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate

# Run linting
Write-Host "Running linting..." -ForegroundColor Yellow
npm run lint

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
npm run test

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

Write-Host "Build completed successfully!" -ForegroundColor Green

# Check if Vercel CLI is available for deployment
try {
    vercel --version | Out-Null
    Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod
    Write-Host "Deployment completed!" -ForegroundColor Green
} catch {
    Write-Host "Vercel CLI not found. Please install it with: npm i -g vercel" -ForegroundColor Cyan
    Write-Host "Or deploy through the Vercel dashboard at https://vercel.com" -ForegroundColor Cyan
    Write-Host "Build is ready for deployment!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deployment process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If not using Vercel CLI, upload the .next folder to your hosting provider"
Write-Host "2. Set up environment variables on your hosting platform"
Write-Host "3. Run database migrations: npm run prisma:migrate"
Write-Host "4. Monitor application logs for any issues"
Write-Host ""
Write-Host "For more details, see DEPLOYMENT.md" -ForegroundColor Cyan
