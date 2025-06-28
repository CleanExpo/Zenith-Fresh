#!/bin/bash

# Script to set up Vercel environment variables
# Run this script to add all required environment variables to your Vercel project

echo "Setting up Vercel environment variables..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Core environment variables
vercel env add DATABASE_URL production < <(echo "postgresql://postgres:esGerRxYDOQdqCHWZXHrTLldfAzpdVFd@switchyard.proxy.rlwy.net:31569/railway")
vercel env add DIRECT_URL production < <(echo "postgresql://postgres:esGerRxYDOQdqCHWZXHrTLldfAzpdVFd@switchyard.proxy.rlwy.net:31569/railway")

# Authentication
vercel env add NEXTAUTH_URL production < <(echo "https://zenith.engineer")
vercel env add NEXTAUTH_SECRET production < <(echo "202e5145552bf1eec543660f0a7f7548")
vercel env add GOOGLE_CLIENT_ID production < <(echo "1042641540611-i6ev2r99kp938m016gi5moagid7humtb.apps.googleusercontent.com")
vercel env add GOOGLE_CLIENT_SECRET production < <(echo "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")

# API Keys
vercel env add ANTHROPIC_API_KEY production < <(echo "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")
vercel env add OPENAI_API_KEY production < <(echo "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")
vercel env add GOOGLE_AI_API_KEY production < <(echo "AIzaSyBLk_upVrezl0ovEio8Zf-bitcGvGdq9cY")
vercel env add GOOGLE_PAGESPEED_API_KEY production < <(echo "AIzaSyCIcXQYvtRWH29tTJy6aCfqi11o00Cy0hk")

# Stripe
vercel env add STRIPE_SECRET_KEY production < <(echo "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")
vercel env add STRIPE_PUBLISHABLE_KEY production < <(echo "pk_live_51Gx5IrHjjUzwIJDNUlnkyODSG4xOzdGRj6RzQctaAJFe0MVhD6NaXMLIqYCAvRzDBeRrFzp3yyRgGV6CblPnpUIT00frcmDwO7")
vercel env add STRIPE_WEBHOOK_SECRET production < <(echo "whsec_dM8MBZSxQJuT10W37uan1SzmoA4JixFS")

# Email
vercel env add RESEND_API_KEY production < <(echo "re_f9hdVViN_8GgCa2A4xM9PXKahtFSwRagQ")

# Monitoring
vercel env add NEXT_PUBLIC_SENTRY_DSN production < <(echo "https://031d3600b3b5a20b0b4748c177c443db@o4509524611366912.ingest.us.sentry.io/4509524612415488")

# DataForSEO
vercel env add DATAFORSEO_API_KEY production < <(echo "5dc71b768cc6379f")
vercel env add DATAFORSEO_LOGIN production < <(echo "phill.m@carsi.com.au")
vercel env add DATAFORSEO_PASSWORD production < <(echo "8PcyMmS84hqjdtR")

# Security
vercel env add JWT_SECRET production < <(echo "1gAxGqMzi0aCFUOP7iT3Szz327L4zVNTGofOH+i4WDNJMNAd1zsRf+vM26KzXpYQI8SfkzPy354wQI8SfkzPy1ADks/unmuSkCw==")
vercel env add CRON_SECRET production < <(echo "zenith-cron-secret-key-2024")

echo "Environment variables setup complete!"
echo ""
echo "IMPORTANT SECURITY NOTICE:"
echo "========================"
echo "The API keys and credentials in this script have been exposed and should be rotated immediately:"
echo "1. Anthropic API Key"
echo "2. OpenAI API Key"
echo "3. Google API Keys"
echo "4. Stripe Keys"
echo "5. Database credentials"
echo "6. All other secrets"
echo ""
echo "Please rotate these credentials as soon as the deployment is working."