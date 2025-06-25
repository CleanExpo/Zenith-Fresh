# Vercel CLI commands to set staging environment variables
# Run these commands to configure staging environment

vercel env add NEXTAUTH_URL staging
# Value: https://staging.zenith.engineer

vercel env add NEXT_PUBLIC_APP_URL staging
# Value: https://staging.zenith.engineer

vercel env add NEXT_PUBLIC_API_URL staging
# Value: https://staging.zenith.engineer/api

vercel env add CORS_ORIGIN staging
# Value: https://staging.zenith.engineer

vercel env add NODE_ENV staging
# Value: staging

vercel env add NEXT_PUBLIC_APP_ENV staging
# Value: staging

vercel env add NEXTAUTH_SECRET staging
# Value: 1dd62cd9b9dae4ad366e05b962c71a6db1aa90284ad54ab4583fce722a116a81

vercel env add JWT_SECRET staging
# Value: 011ffe6fb0a31b5d2ddc075651aa0c20294d29b9eb7a7b191af1f8cc1caca97edd36818d8587203522eff5576503b54973a45d6e0a4aabf5c99dac420e385a55

# DATABASE_URL=# TO BE FILLED FROM RAILWAY
# POSTGRES_PRISMA_URL=# TO BE FILLED FROM RAILWAY
# POSTGRES_URL_NON_POOLING=# TO BE FILLED FROM RAILWAY
# DIRECT_URL=# TO BE FILLED FROM RAILWAY
# GOOGLE_CLIENT_ID=# COPY FROM PRODUCTION
# GOOGLE_CLIENT_SECRET=# COPY FROM PRODUCTION
vercel env add STRIPE_SECRET_KEY staging
# Value: sk_test_# USE STRIPE TEST KEYS

vercel env add STRIPE_PUBLISHABLE_KEY staging
# Value: pk_test_# USE STRIPE TEST KEYS

vercel env add STRIPE_WEBHOOK_SECRET staging
# Value: whsec_# USE STRIPE TEST WEBHOOK

vercel env add REDIS_URL staging
# Value: redis://# STAGING REDIS INSTANCE

# RESEND_API_KEY=# SAME AS PRODUCTION OR TEST KEY
vercel env add EMAIL_FROM staging
# Value: staging@zenith.engineer

# OPENAI_API_KEY=# COPY FROM PRODUCTION IF NEEDED
# ANTHROPIC_API_KEY=# COPY FROM PRODUCTION IF NEEDED
# GOOGLE_AI_API_KEY=# COPY FROM PRODUCTION IF NEEDED
# NEXT_PUBLIC_SENTRY_DSN=# STAGING SENTRY PROJECT DSN
vercel env add SENTRY_ORG staging
# Value: zenith-platform

vercel env add SENTRY_PROJECT staging
# Value: zenith-staging

# NEXT_PUBLIC_GA_MEASUREMENT_ID=# STAGING GA4 PROPERTY
vercel env add FEATURE_FLAGS_ENABLED staging
# Value: true

vercel env add NEXT_PUBLIC_FEATURE_ENHANCED_ANALYZER staging
# Value: true

vercel env add NEXT_PUBLIC_FEATURE_TEAM_MANAGEMENT staging
# Value: true

vercel env add NEXT_PUBLIC_FEATURE_AI_CONTENT_ANALYSIS staging
# Value: false

vercel env add NEXT_PUBLIC_FEATURE_COMPETITIVE_INTELLIGENCE staging
# Value: false

vercel env add STAGING_MODE staging
# Value: true

vercel env add DISABLE_PAYMENT_PROCESSING staging
# Value: true

vercel env add MOCK_EXTERNAL_APIS staging
# Value: false

vercel env add FORCE_HTTPS staging
# Value: true

vercel env add SECURE_COOKIES staging
# Value: true
