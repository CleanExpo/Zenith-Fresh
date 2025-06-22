# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zenith Platform is a modern AI-powered team management and content platform built with Next.js 14 (App Router), TypeScript, Prisma, and PostgreSQL. It features a hybrid architecture with both App Router (`src/app/`) and Pages Router (`src/pages/`) components, comprehensive team analytics, billing management, and third-party integrations.

## Essential Commands

### Development
```bash
npm run dev                  # Start development server
npm run build               # Production build with Prisma generation
npm run start               # Start production server
npm run lint                # ESLint with Next.js config
```

### Database Operations
```bash
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Deploy migrations (production)
npm run db:push             # Push schema changes (development)
npm run prisma:studio       # Open Prisma Studio
npm run db:backup           # Pull and push schema (backup)
```

### Testing
```bash
npm run test                # Run Jest tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report (80% threshold)
```

### Deployment
```bash
npm run deploy              # Automated deployment via ./deploy.sh
npm run deploy:quick        # Quick commit and push
npm run deploy:check        # Status check before deploy
```

## Architecture Overview

### Hybrid Routing Structure
- **App Router** (`src/app/`): Modern Next.js 13+ features, API routes, layouts, error boundaries
- **Pages Router** (`src/pages/`): Legacy team management pages, complex routing patterns

### Key Directories
- `src/app/api/`: REST API endpoints with route handlers
- `src/components/`: Reusable UI components with shadcn/ui
- `src/lib/`: Core utilities (auth, database, integrations)
- `src/middleware/`: Request processing, authentication, rate limiting
- `src/hooks/`: React hooks for data fetching and state management

### Database Architecture
The Prisma schema (`prisma/schema.prisma`) implements a comprehensive team management system:

**Core Entities:**
- `User` → `TeamMember` → `Team` (many-to-many with roles)
- `Project` → `ProjectMember` (team-scoped projects)
- `TeamAnalytics`, `TeamBilling`, `TeamSettings` (team features)

**Key Relationships:**
- Users can belong to multiple teams with different roles
- Teams have analytics, billing, and settings as separate entities
- Projects can be team-scoped or user-scoped
- Comprehensive audit logging via `ActivityLog` and `AuditLog`

### Authentication System
- NextAuth.js with Prisma adapter
- Credentials provider with bcrypt password hashing
- JWT strategy with database user lookup
- Protected routes via middleware (`src/middleware.ts`)

## Critical Patterns

### Client vs Server Components
Most pages and components use 'use client' directive due to:
- Interactive features (React Query, state management)
- Third-party integrations (analytics, auth)
- Dynamic content and real-time updates

### Data Fetching
- React Query (`@tanstack/react-query`) for client-side caching
- Server actions for mutations where appropriate
- Prisma client with connection pooling configuration

### Error Handling
- Global error boundaries in App Router
- Sentry integration for production monitoring
- Custom error pages with user-friendly messages

### Rate Limiting & Security
Middleware implements:
- IP-based rate limiting (100 req/min)
- Security headers (CSP, HSTS, XSS protection)
- CORS configuration
- Protected route authentication

## Integration Architecture

### Third-Party Services
- **Stripe**: Payment processing (`/api/stripe/webhook`)
- **Google Analytics**: Usage tracking (`/api/analytics/google`)
- **Google Cloud Storage**: File management
- **Sentry**: Error monitoring and performance
- **Resend**: Email service (`/api/admin/resend`)
- **Redis**: Caching and session storage

### Cron Jobs
- Database cleanup (`/api/cron/database-cleanup`)
- Email queue processing (`/api/cron/email-queue`)
- Health checks (`/api/cron/health-check`)

## Development Guidelines

### Path Aliases
Use `@/` prefix for all internal imports:
```typescript
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
```

### Database Queries
Always use the singleton Prisma client from `@/lib/prisma`:
```typescript
import { prisma } from '@/lib/prisma';
// Includes proper logging and connection management
```

### Component Development
- UI components in `src/components/ui/` follow shadcn/ui patterns
- Feature components organized by domain (auth, dashboard, team)
- Use TypeScript interfaces for props and data structures

### Testing Strategy
- Component tests in `__tests__` directories
- 80% coverage threshold enforced
- E2E tests in `tests/e2e/`
- Load testing configuration in `tests/load/`

## Deployment Automation

The `deploy.sh` script provides automated deployment:
1. Checks for unstaged changes
2. Commits with standardized message format
3. Pushes to GitHub (triggers Vercel deployment)
4. Handles authentication and error scenarios

**Important**: Always run `npm run build` locally before deploying to catch TypeScript/build errors.

## Configuration Notes

### Next.js Config
- TypeScript and ESLint errors ignored during builds (for CI/CD speed)
- Standalone output for containerized deployments
- Custom webpack configuration for Prisma

### Environment Variables
Required for development (check existing documentation files):
- Database connection strings
- Authentication secrets
- Third-party API keys
- Integration credentials

### Middleware Protected Routes
Authentication required for:
- `/dashboard/*`
- `/projects/*`
- `/analytics/*`
- `/settings/*`

## Common Patterns

### Team Context
Most features require team context. Check user's team membership and role before rendering:
```typescript
const teamMember = await prisma.teamMember.findFirst({
  where: { userId, teamId },
  include: { team: true }
});
```

### Analytics Tracking
Use the analytics system to track user actions:
```typescript
await prisma.analytics.create({
  data: {
    type: 'action_type',
    action: 'specific_action',
    userId,
    metadata: { ... }
  }
});
```

### File Uploads
Use the upload API (`/api/upload`) with Google Cloud Storage integration for file management.