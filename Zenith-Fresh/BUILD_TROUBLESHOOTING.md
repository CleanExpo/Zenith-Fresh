# Build Troubleshooting Guide

## Common Issues and Solutions

### 1. createContext Build Errors

**Error:**
```
TypeError: (0 , n.createContext) is not a function
Error: Failed to collect page data for /contact or /pricing
```

**Solution:**
Clear the Next.js build cache and rebuild:
```bash
rm -rf .next
npm run build
```

**Root Cause:** Stale cached build files from previous builds with different configurations.

### 2. Environment Variable Issues

**Error:**
```
Error: Command "npm run build" exited with 1
```

**Solution:**
Ensure all required environment variables are set:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `MASTER_USERNAME`
- `MASTER_PASSWORD`
- `OPENAI_API_KEY`
- `STAFF_USERS`

### 3. Vercel Deployment

**For successful Vercel deployment:**
1. Clear local cache: `rm -rf .next`
2. Test local build: `npm run build`
3. Ensure all environment variables are set in Vercel dashboard
4. Deploy: `vercel --prod`

## Verification Steps

1. **Local Build Test:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Environment Check:**
   All required variables must be configured in production environment.

3. **Clean Deployment:**
   Clear Vercel build cache if deployment fails.