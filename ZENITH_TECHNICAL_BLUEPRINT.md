# Zenith Platform: Live Data Integration Technical Blueprint

## Overview
This blueprint outlines the transition from mock data to a robust, scalable backend architecture that fetches, stores, and serves live data from multiple third-party sources while maintaining security, performance, and cost efficiency.

## Core Architecture: Server-Side API Gateway

### Security-First Approach
- **No Direct Client API Calls**: All external API communication happens server-side
- **Secure Credential Management**: API keys stored as server environment variables
- **OAuth Flow Management**: Secure token storage and refresh handling

### Data Flow Architecture
```
Client Browser → Zenith API Route → External API → Zenith API Route → Client Browser
```

## Module Integration Strategy

### Module A: Google Business Profile (GMB)
**External API**: Google Business Profile API  
**Authentication**: Google OAuth 2.0 with refresh token storage

#### API Routes to Implement
```typescript
// Core business information
GET /api/presence/gmb/profile
Response: {
  name: string;
  address: string;
  phone: string;
  hours: BusinessHours[];
  verified: boolean;
  categories: string[];
}

// Reviews management
GET /api/presence/gmb/reviews
Response: {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  responseRate: number;
}

POST /api/presence/gmb/reviews/:reviewId/reply
Body: { reply: string }
Response: { success: boolean; replyId: string }

// Google Posts
POST /api/presence/gmb/posts
Body: { 
  content: string; 
  media?: File; 
  callToAction?: string;
  link?: string 
}
Response: { success: boolean; postId: string }
```

### Module B: Social Media Presence
**External APIs**: Meta Graph API, X API, LinkedIn API  
**Authentication**: Platform-specific OAuth 2.0 flows

#### API Routes to Implement
```typescript
// Unified social stats
GET /api/presence/social/stats
Response: {
  platforms: {
    facebook: SocialStats;
    instagram: SocialStats;
    twitter: SocialStats;
    linkedin: SocialStats;
  };
  totalFollowers: number;
  totalEngagement: number;
}

// Cross-platform publishing
POST /api/presence/social/publish
Body: {
  content: string;
  platforms: Platform[];
  media?: File[];
  scheduledTime?: Date;
}
Response: {
  success: boolean;
  postIds: { platform: string; id: string }[];
}
```

### Module C: Competitive Intelligence
**External API**: DataForSEO API (recommended) / Semrush API / Ahrefs API  
**Authentication**: Master API key (server environment variable)

#### API Routes to Implement
```typescript
// Keyword rankings
POST /api/presence/keywords/rankings
Body: { 
  keywords: string[]; 
  domain: string;
  location?: string;
}
Response: {
  rankings: {
    keyword: string;
    position: number;
    volume: number;
    difficulty: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }[];
}

// Local grid rankings
POST /api/presence/local/grid
Body: { 
  keyword: string; 
  location: string;
  gridSize?: number;
}
Response: {
  gridData: {
    position: { lat: number; lng: number };
    ranking: number;
    business: string;
  }[];
  averagePosition: number;
  visibility: number;
}

// Competitor analysis
POST /api/presence/competitors/analyze
Body: { 
  domain: string; 
  competitors: string[];
  keywords: string[];
}
Response: {
  competitorData: {
    domain: string;
    rankings: KeywordRanking[];
    visibility: number;
    traffic: number;
  }[];
}
```

## Database Schema Extensions

### Enhanced Prisma Schema
```prisma
// Keyword tracking and rankings
model KeywordRanking {
  id          String    @id @default(cuid())
  keyword     String
  domain      String
  position    Int
  volume      Int
  difficulty  Int
  trend       String    // 'up', 'down', 'stable'
  change      Int       // Position change from last check
  location    String?   // For local rankings
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  clientId    String
  client      User      @relation(fields: [clientId], references: [id])
  
  @@index([clientId, keyword, createdAt])
  @@index([domain, createdAt])
}

// Local SEO grid data
model LocalRankReport {
  id        String    @id @default(cuid())
  keyword   String
  location  String
  domain    String
  gridData  Json      // Array of position/ranking objects
  avgPosition Float
  visibility  Float
  createdAt DateTime  @default(now())
  clientId  String
  client    User      @relation(fields: [clientId], references: [id])
  
  @@index([clientId, keyword, location])
}

// Google Business Profile data
model GmbProfile {
  id          String    @id @default(cuid())
  gmbId       String    @unique
  name        String
  address     String
  phone       String
  website     String?
  categories  String[]
  verified    Boolean
  rating      Float?
  reviewCount Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  clientId    String    @unique
  client      User      @relation(fields: [clientId], references: [id])
  reviews     GmbReview[]
  posts       GmbPost[]
}

model GmbReview {
  id          String    @id @default(cuid())
  gmbId       String    // Google's review ID
  gmbProfileId String
  gmbProfile  GmbProfile @relation(fields: [gmbProfileId], references: [id])
  author      String
  rating      Float
  text        String
  replied     Boolean   @default(false)
  replyText   String?
  createdAt   DateTime
  updatedAt   DateTime  @updatedAt
  clientId    String
  client      User      @relation(fields: [clientId], references: [id])
  
  @@index([gmbProfileId, createdAt])
  @@index([clientId, replied])
}

model GmbPost {
  id           String     @id @default(cuid())
  gmbProfileId String
  gmbProfile   GmbProfile @relation(fields: [gmbProfileId], references: [id])
  content      String
  mediaUrl     String?
  callToAction String?
  link         String?
  published    Boolean    @default(false)
  publishedAt  DateTime?
  createdAt    DateTime   @default(now())
  clientId     String
  client       User       @relation(fields: [clientId], references: [id])
  
  @@index([gmbProfileId, publishedAt])
}

// Social media integration
model SocialAccount {
  id          String    @id @default(cuid())
  platform    String    // 'facebook', 'instagram', 'twitter', 'linkedin'
  platformId  String    // Platform-specific user/page ID
  username    String
  followers   Int       @default(0)
  accessToken String    // Encrypted OAuth token
  refreshToken String?  // Encrypted refresh token
  tokenExpiry DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  clientId    String
  client      User      @relation(fields: [clientId], references: [id])
  posts       SocialPost[]
  
  @@unique([clientId, platform, platformId])
  @@index([clientId, platform])
}

model SocialPost {
  id              String        @id @default(cuid())
  socialAccountId String
  socialAccount   SocialAccount @relation(fields: [socialAccountId], references: [id])
  content         String
  mediaUrls       String[]      @default([])
  platformPostId  String?       // ID from the social platform
  scheduled       Boolean       @default(false)
  scheduledFor    DateTime?
  published       Boolean       @default(false)
  publishedAt     DateTime?
  engagement      Json?         // likes, comments, shares, etc.
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  clientId        String
  client          User          @relation(fields: [clientId], references: [id])
  
  @@index([socialAccountId, publishedAt])
  @@index([clientId, scheduled, scheduledFor])
}

// OAuth connections tracking
model OAuthConnection {
  id           String    @id @default(cuid())
  provider     String    // 'google', 'facebook', 'twitter', 'linkedin'
  providerId   String    // User ID from the provider
  accessToken  String    // Encrypted
  refreshToken String?   // Encrypted
  scope        String[]  // Permissions granted
  tokenExpiry  DateTime?
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  clientId     String
  client       User      @relation(fields: [clientId], references: [id])
  
  @@unique([clientId, provider])
  @@index([provider, isActive])
}

// API usage tracking for cost management
model ApiUsage {
  id         String    @id @default(cuid())
  provider   String    // 'dataForSEO', 'semrush', 'google', etc.
  endpoint   String    // Specific API endpoint called
  cost       Float     // Cost in credits/dollars
  requestData Json     // Parameters sent
  success    Boolean
  createdAt  DateTime  @default(now())
  clientId   String?
  client     User?     @relation(fields: [clientId], references: [id])
  
  @@index([provider, createdAt])
  @@index([clientId, createdAt])
}
```

## Caching Strategy: Multi-Layer Architecture

### Layer 1: Redis Cache (Hot Data)
- **TTL**: 1 hour for most data
- **Use Case**: Immediate responses for repeated requests
- **Storage**: Live API responses, computed metrics

### Layer 2: PostgreSQL Database (Warm Data)
- **Retention**: 24-48 hours for recent data
- **Use Case**: Historical trends, backup when Redis expires
- **Storage**: All fetched data with timestamps

### Layer 3: External APIs (Cold Data)
- **Frequency**: Only when cache misses occur
- **Cost Management**: Rate limiting, usage tracking
- **Storage**: Fresh data directly from providers

### Caching Implementation Example
```typescript
// /api/presence/keywords/rankings
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords')?.split(',') || [];
  const domain = searchParams.get('domain') || '';
  
  const cacheKey = `rankings:${domain}:${keywords.join(',')}`;
  
  // Layer 1: Check Redis
  const cached = await redis.get(cacheKey);
  if (cached) {
    return Response.json(JSON.parse(cached));
  }
  
  // Layer 2: Check Database (last 24 hours)
  const recent = await prisma.keywordRanking.findMany({
    where: {
      domain,
      keyword: { in: keywords },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    },
    orderBy: { createdAt: 'desc' },
    take: keywords.length
  });
  
  if (recent.length === keywords.length) {
    const data = formatRankingData(recent);
    await redis.setex(cacheKey, 3600, JSON.stringify(data));
    return Response.json(data);
  }
  
  // Layer 3: Fetch from External API
  const freshData = await dataForSEO.getRankings(keywords, domain);
  
  // Store in database
  await prisma.keywordRanking.createMany({
    data: freshData.map(item => ({
      ...item,
      domain,
      clientId: getClientId(request)
    }))
  });
  
  // Store in Redis
  await redis.setex(cacheKey, 3600, JSON.stringify(freshData));
  
  // Track API usage
  await trackApiUsage('dataForSEO', 'rankings', freshData.length * 0.01);
  
  return Response.json(freshData);
}
```

## Integration Timeline & Implementation Phases

### Phase 1: Infrastructure Setup (Week 1-2)
- Set up DataForSEO/Semrush API accounts
- Implement OAuth flows for Google, Facebook, Twitter, LinkedIn
- Create database schema migrations
- Set up Redis caching layer
- Implement API usage tracking

### Phase 2: Core Integrations (Week 3-5)
- **Google Business Profile API**
  - Profile data fetching
  - Review management
  - Google Posts creation
- **Basic Social Media APIs**
  - Account connection flows
  - Stats fetching
  - Simple post publishing

### Phase 3: Competitive Intelligence (Week 6-8)
- **SEO Data Integration**
  - Keyword ranking tracking
  - Local grid mapping
  - Competitor analysis
- **Advanced Caching**
  - Multi-layer cache optimization
  - Background refresh jobs
  - Cost monitoring dashboards

### Phase 4: Advanced Features (Week 9-12)
- **Enhanced Social Media**
  - Cross-platform publishing
  - Engagement analytics
  - Content scheduling
- **AI Integration**
  - Automated insights generation
  - Predictive analytics
  - Recommendation engines

## Cost Management & Monitoring

### API Cost Tracking
```typescript
// Cost monitoring service
class ApiCostManager {
  async trackUsage(provider: string, endpoint: string, cost: number) {
    await prisma.apiUsage.create({
      data: { provider, endpoint, cost, success: true }
    });
    
    // Alert if monthly costs exceed thresholds
    const monthlyUsage = await this.getMonthlyUsage(provider);
    if (monthlyUsage > COST_THRESHOLDS[provider]) {
      await this.sendCostAlert(provider, monthlyUsage);
    }
  }
  
  async getMonthlyUsage(provider: string): Promise<number> {
    const result = await prisma.apiUsage.aggregate({
      where: {
        provider,
        createdAt: { gte: startOfMonth(new Date()) }
      },
      _sum: { cost: true }
    });
    return result._sum.cost || 0;
  }
}
```

### Rate Limiting Strategy
- **DataForSEO**: 1000 requests/month on starter plan
- **Google APIs**: Built-in quotas with exponential backoff
- **Social Media APIs**: Platform-specific limits with queue management

## Security Considerations

### Token Management
- All OAuth tokens encrypted at rest using AES-256
- Automatic token refresh before expiry
- Secure token revocation on account disconnect

### API Key Security
- Environment variables for all external API keys
- Separate keys for development/staging/production
- Regular key rotation schedule

### Data Privacy
- Client data isolation at database level
- GDPR compliance for EU clients
- Data retention policies for cached information

## Monitoring & Alerting

### Key Metrics to Track
- API response times and success rates
- Cache hit ratios and performance
- Monthly API costs per client
- Data freshness and accuracy
- OAuth token expiration alerts

### Dashboard Implementation
- Real-time API status monitoring
- Cost tracking per client/feature
- Performance metrics visualization
- Error rate trending and alerting

This technical blueprint provides the foundation for transforming Zenith from a mock data prototype into a production-ready SaaS platform with live, accurate data from multiple enterprise-grade sources.
