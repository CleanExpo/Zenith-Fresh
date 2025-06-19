# Google API Setup Guide for Zenith-Fresh

## Required Google APIs

Based on the codebase analysis, Zenith-Fresh requires the following Google APIs:

### 1. **Google OAuth 2.0 API** (REQUIRED)
- **Purpose**: User authentication via Google accounts
- **Used in**: `/src/app/api/auth/[...nextauth]/route.ts`
- **Status**: ❌ Not configured (missing credentials)

### 2. **Google AI (Gemini) API** (OPTIONAL)
- **Purpose**: AI/ML capabilities (API key present but not used)
- **Environment Variable**: `GOOGLE_AI_API_KEY` ✅ Already configured
- **Status**: ⚠️ API key present but no implementation found

### 3. **Google Fonts** (ACTIVE)
- **Purpose**: Typography (Inter font)
- **Status**: ✅ Working (no API key required)

## Step-by-Step Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "Zenith-Fresh" or similar

### Step 2: Enable Required APIs
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search and enable:
   - **Google+ API** or **Google Identity Platform**
   - **People API** (for user profile information)

### Step 3: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - **App name**: Zenith Platform
   - **User support email**: Your email
   - **App domain**: zenith.engineer
   - **Authorized domains**: zenith.engineer
   - **Developer contact**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users if in testing mode

### Step 4: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: Zenith Web Client
   - **Authorized JavaScript origins**:
     ```
     https://zenith.engineer
     https://www.zenith.engineer
     http://localhost:3000 (for development)
     ```
   - **Authorized redirect URIs**:
     ```
     https://zenith.engineer/api/auth/callback/google
     https://www.zenith.engineer/api/auth/callback/google
     http://localhost:3000/api/auth/callback/google (for development)
     ```
5. Save and copy the credentials

### Step 5: Add Environment Variables
Add to your `.env` file:
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Step 6: Update Vercel Environment Variables
1. Go to Vercel Dashboard > Project Settings > Environment Variables
2. Add:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
3. Redeploy the application

## Testing Google OAuth

### Local Testing
1. Update `.env.local` with Google credentials
2. Run `npm run dev`
3. Navigate to login page
4. Click "Sign in with Google"
5. Should redirect to Google OAuth flow

### Production Testing
1. Ensure all redirect URIs match exactly
2. Check browser console for errors
3. Verify callback URL is accessible

## Common Issues & Solutions

### Issue: "Redirect URI mismatch"
- **Solution**: Ensure the redirect URI in Google Console exactly matches your app's callback URL
- Include both `https://` and `https://www.` versions
- Add trailing slashes if needed

### Issue: "Access blocked: This app's request is invalid"
- **Solution**: Check OAuth consent screen is properly configured
- Ensure all required fields are filled
- Verify authorized domains include your domain

### Issue: "Invalid client ID"
- **Solution**: Double-check environment variables
- Ensure no extra spaces or quotes in the values
- Verify the client ID format

## Security Best Practices

1. **Never commit credentials** to Git
2. **Use different credentials** for development and production
3. **Restrict API key** usage in Google Console:
   - For `GOOGLE_AI_API_KEY`: Restrict to specific APIs and websites
4. **Monitor usage** in Google Cloud Console
5. **Set up alerts** for unusual activity

## Additional Google APIs (Future Consideration)

If you plan to add more features, consider these APIs:

1. **Google Analytics 4**
   - For user behavior tracking
   - Requires gtag.js implementation

2. **Google Maps JavaScript API**
   - For location-based features
   - Requires API key and billing

3. **Google Drive API**
   - For file storage/collaboration
   - Requires additional OAuth scopes

4. **Google Calendar API**
   - For scheduling features
   - Requires additional OAuth scopes

## Verification Checklist

- [ ] Google Cloud Project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs added (including www and non-www)
- [ ] Environment variables added to `.env`
- [ ] Environment variables added to Vercel
- [ ] Local testing successful
- [ ] Production testing successful

## Support Resources

- [NextAuth.js Google Provider Docs](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)