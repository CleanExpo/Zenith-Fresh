# NextAuth Authentication Setup - Zenith Platform

This document describes the complete NextAuth.js authentication implementation for the Zenith Platform.

## 🏗️ Architecture Overview

The authentication system is built with:
- **NextAuth.js 4.24.5** - Authentication framework
- **Prisma 5.7.0** - Database ORM with NextAuth adapter  
- **bcryptjs** - Password hashing
- **PostgreSQL** - Database (via Prisma)

## 📁 File Structure

```
/lib/auth.ts                    # NextAuth configuration
/lib/prisma.ts                  # Prisma client singleton
/app/api/auth/[...nextauth]/    # NextAuth API routes
/prisma/schema.prisma           # Database schema
/types/next-auth.d.ts           # TypeScript type extensions
/src/components/SessionProvider.tsx    # React session provider
/src/components/auth/SignInForm.tsx    # Sign-in form component
/src/hooks/useAuth.ts           # Authentication hook
/src/app/auth/signin/page.tsx   # Sign-in page
/src/app/auth/error/page.tsx    # Auth error page
/middleware.ts                  # Route protection middleware
```

## 🔧 Configuration Files

### Environment Variables (.env)
```env
# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/zenith_db

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### NextAuth Configuration (/lib/auth.ts)
- **Providers**: Credentials (email/password) + Google OAuth
- **Database Adapter**: Prisma adapter for session/user storage
- **Session Strategy**: JWT tokens
- **Callbacks**: Custom user data handling and audit logging
- **Pages**: Custom sign-in and error pages

### Database Schema (/prisma/schema.prisma)
- **User**: User accounts with role-based access
- **Account**: OAuth account linking
- **Session**: User sessions
- **VerificationToken**: Email verification tokens
- **Project**: User projects (Zenith-specific)
- **AuditLog**: Authentication event logging

## 🚀 Setup Instructions

### 1. Quick Setup
Run the automated setup script:
```bash
./scripts/setup-auth.sh
```

### 2. Manual Setup
```bash
# Install dependencies
npm install @next-auth/prisma-adapter @prisma/client bcryptjs next-auth
npm install --save-dev @types/bcryptjs prisma

# Generate Prisma client
npx prisma generate

# Setup database
npx prisma db push

# Seed demo user
npm run db:seed
```

### 3. Configure Database
Set your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/zenith_db"
```

### 4. Google OAuth Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Add credentials to `.env`

## 🔐 Authentication Features

### Supported Authentication Methods
1. **Email/Password**: Traditional credentials with bcrypt hashing
2. **Google OAuth**: Single sign-on with Google accounts
3. **Demo User**: Pre-configured admin user for testing

### Demo Credentials
- **Email**: `zenithfresh25@gmail.com`
- **Password**: `F^bf35(llm1120!2a`
- **Role**: `admin`

### Security Features
- Password hashing with bcrypt (12 rounds)
- JWT session tokens (30-day expiry)
- CSRF protection via NextAuth
- Secure cookie settings
- Route protection middleware
- Audit logging for auth events

### Role-Based Access Control
- **admin**: Full platform access
- **user**: Standard user access
- Custom roles can be added to the User model

## 🛡️ Route Protection

### Middleware Protection (/middleware.ts)
Protected routes automatically redirect unauthenticated users:
- `/dashboard/*` - User dashboard
- `/admin/*` - Admin panel
- `/api/*` - API endpoints (rate limited)

### Server-Side Protection
Pages use `getServerSession()` for server-side auth checks:
```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return <div>Protected content</div>
}
```

### Client-Side Protection
Components use the `useAuth` hook:
```typescript
import { useAuth } from '@/hooks/useAuth'

export function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>
  
  return <div>Welcome {user?.name}!</div>
}
```

## 🔍 Database Operations

### User Management
```typescript
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// Create user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    password: await hashPassword('password123'),
    role: 'user'
  }
})

// Find user
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
})
```

### Session Management
Sessions are automatically handled by NextAuth + Prisma adapter.

### Audit Logging
Authentication events are automatically logged:
```typescript
// Example audit log entry
{
  action: 'USER_SIGNIN',
  details: {
    email: 'user@example.com',
    provider: 'credentials'
  },
  userId: 'user-id',
  createdAt: '2024-01-01T00:00:00.000Z'
}
```

## 🧪 Testing

### Verify Setup
```bash
node scripts/verify-auth.js
```

### Test Authentication
1. Start development server: `npm run dev`
2. Visit: `http://localhost:3000/auth/signin`
3. Use demo credentials or create new account
4. Verify redirect to dashboard

### Database Inspection
```bash
npx prisma studio
```

## 🚀 Production Deployment

### Environment Variables
Ensure production environment has:
- `NEXTAUTH_SECRET` - Strong random secret
- `NEXTAUTH_URL` - Production domain
- `DATABASE_URL` - Production database connection
- Google OAuth credentials (if using)

### Security Checklist
- [ ] Strong `NEXTAUTH_SECRET` generated
- [ ] HTTPS enabled for production
- [ ] Database connection secured
- [ ] OAuth redirect URIs configured
- [ ] Rate limiting enabled via middleware
- [ ] Audit logging active

## 🔧 Customization

### Adding New Providers
Add to `/lib/auth.ts`:
```typescript
import GitHubProvider from 'next-auth/providers/github'

providers: [
  // ... existing providers
  GitHubProvider({
    clientId: process.env.GITHUB_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
  })
]
```

### Custom User Fields
1. Update Prisma schema
2. Run `npx prisma db push`
3. Update NextAuth callbacks
4. Update TypeScript types

### Custom Pages
Override default pages in `/lib/auth.ts`:
```typescript
pages: {
  signIn: '/auth/signin',
  signUp: '/auth/signup',
  error: '/auth/error',
  verifyRequest: '/auth/verify-request',
  newUser: '/auth/new-user'
}
```

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth Prisma Adapter](https://next-auth.js.org/adapters/prisma)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## 🐛 Troubleshooting

### Common Issues

1. **"Prisma Client not found"**
   ```bash
   npx prisma generate
   ```

2. **Database connection failed**
   - Verify `DATABASE_URL` format
   - Check database server is running
   - Confirm credentials are correct

3. **Session not persisting**
   - Check `NEXTAUTH_SECRET` is set
   - Verify cookies are enabled
   - Check domain/HTTPS configuration

4. **Google OAuth errors**
   - Verify redirect URIs match exactly
   - Check client ID/secret are correct
   - Ensure Google+ API is enabled

### Debug Mode
Set `debug: true` in NextAuth config for development:
```typescript
export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  // ... rest of config
}
```

---

**✅ Authentication system is fully configured and ready for production deployment!**