# Technical Blueprint: Powering the Zenith Platform with Live Data

## Objective
To transition the Zenith platform from using mock data to a robust, scalable backend architecture that fetches, stores, and serves live, accurate data from multiple third-party sources.

## 1. Core Architectural Approach: Server-Side API Gateway

To ensure security and manage costs, Zenith will not make direct calls to third-party APIs from the client's browser. Instead, our Zenith backend will act as a secure API gateway.

**Frontend (PresenceCommandCenter.tsx)**: The React component will make requests only to our own internal API routes (e.g., `/api/presence/gmb/reviews`).

**Backend (Next.js API Routes)**: These server-side routes will contain the secure logic and API keys to call the external services (Google, Semrush, etc.). This keeps all sensitive credentials completely hidden from the client.

### Data Flow:
```
Client Browser -> Zenith API Route -> External API -> Zenith API Route -> Client Browser
```

## 2. The Zenith Onboarding Wizard (Post-Subscription)

To ensure the secure and structured collection of client data, a mandatory Onboarding Wizard will be triggered immediately following a user's subscription to a paid tier. This is the primary mechanism for populating the platform with the live data necessary for the LLM Agents to function.

**Trigger**: Successful processing of a new paid subscription. The user is redirected from the payment confirmation page to `/onboarding/start`.

**User Experience**: A full-screen, multi-step interface that guides the user through the connection process. Progress is saved at each step, allowing the user to resume if they leave.

### Onboarding Steps:

1. **Welcome & Introduction**: Briefly explains the importance of connecting their digital assets to unlock the full power of Zenith. It will display a preliminary Zenith Health Score based on the initial, public analysis of their website, setting a benchmark.

2. **Core Asset Connection**:
   - Prompt to connect their Google Account via OAuth for Google Business Profile.
   - Confirms the primary website URL to be analyzed.

3. **Social Presence Connection**:
   - Presents individual OAuth connection buttons for Facebook, Instagram, X, and LinkedIn.
   - Locked connections (e.g., LinkedIn for Pro users) will be greyed out with an "Upgrade to Business" prompt.

4. **Secure Credential Vault**:
   - A secure form to input non-OAuth credentials like tracking IDs (e.g., Google Analytics Measurement ID).
   - The UI must explicitly state that this data is stored using end-to-end encryption.

5. **Final Sync & Health Score Reveal**:
   - A "magic moment" status screen showing the LLM Agents working (e.g., "Auditing GMB NAP Consistency...", "Fetching Social Engagement Metrics...").
   - Upon completion, the user is presented with their new, comprehensive Zenith Health Score. This score, now powered by the live data from all connected accounts, will be significantly more accurate and insightful than the preliminary score, providing immediate and powerful validation for their subscription.
   - The user is then redirected to their fully populated Presence Command Center.

## 3. Data Integration Plan & Required APIs

Here is the breakdown of the necessary integrations for each feature module, to be enabled via the Onboarding Wizard.

### Required Zenith Platform Accounts
To enable these integrations, the Zenith platform itself will need active developer or enterprise accounts with the following services:

- **DataForSEO API**: (For SEO, keyword, and competitive data)
- **Google Cloud Console Project**: (To enable the Google Business Profile API)
- **Meta Developer Account**: (To enable the Facebook & Instagram Graph APIs)
- **X Developer Account**: (To enable the X API)
- **LinkedIn Developer Account**: (To enable the LinkedIn API)

### Module A: Google Business Profile (GMB)
**Third-Party API**: Google Business Profile API

**Authentication**: We will implement a Google OAuth 2.0 flow. Clients will be prompted to securely connect their Google Account and grant Zenith permission to manage their GMB listing. Our backend will securely store the OAuth refresh tokens in our database, associated with the client's account, to maintain the connection.

**Internal API Routes to Build**:

- `GET /api/presence/gmb/profile`: Fetches core business info (NAP, hours, etc.) for the GMB Health widget.
- `GET /api/presence/gmb/reviews`: Fetches a live feed of all GMB reviews for the Review Management Hub.
- `POST /api/presence/gmb/reviews/:reviewId/reply`: Allows the client to post a reply to a review.
- `POST /api/presence/gmb/posts`: Allows the client to create and publish a new Google Post.

### Module B: Social Media Presence
**Third-Party APIs**:
- **Meta Graph API**: For Facebook & Instagram.
- **X API (Formerly Twitter)**: For X platform integration.
- **LinkedIn API**: For LinkedIn integration.

**Authentication**: Each platform will require its own separate OAuth 2.0 connection flow within the Zenith dashboard.

**Internal API Routes to Build**:

- `GET /api/presence/social/stats`: Fetches key metrics (followers, engagement) from all connected platforms.
- `POST /api/presence/social/publish`: A unified endpoint that takes content and distributes it to the selected social platforms via their respective APIs.

### Module C: Competitive Landscape (Semrush & Local Falcon Data)
This is the most critical and cost-intensive integration. To provide this data, Zenith must subscribe to a specialized, third-party SEO data provider.

**Recommended Third-Party API**: DataForSEO API. It is highly scalable, reliable, and designed for building custom solutions like Zenith. Alternatives include the Semrush API or Ahrefs API, but DataForSEO offers more granular control for this type of application.

**Authentication**: Zenith will use its own master API key for the chosen service. This key will be stored securely as a server-side environment variable and is a core business expense for Zenith.

**Internal API Routes to Build**:

- `POST /api/presence/keywords/rankings`:
  - **Request Body**: `{ keywords: ['keyword1', 'keyword2'], domain: 'clientdomain.com' }`
  - **Action**: Calls the DataForSEO "Rank Tracker" endpoint.
  - **Response**: Returns the live search engine position, search volume, and keyword difficulty.

- `POST /api/presence/local/grid`:
  - **Request Body**: `{ keyword: 'plumber near me', location: 'Ipswich, QLD' }`
  - **Action**: This is a complex route. It will make a series of calls to the DataForSEO "Google Maps Search" endpoint, programmatically setting different geo-coordinates for each call to simulate the grid points.
  - **Response**: Returns an array of rankings that the frontend will use to render the visual grid.

## 3. Essential Data Caching & Database Strategy

Making live API calls for every page load is slow and prohibitively expensive. A robust caching and database strategy is non-negotiable.

**Problem**: API calls to DataForSEO cost money per call. GMB API calls have rate limits. We need to minimize these calls while providing data that feels fresh.

**Solution**: We will use our existing Redis and PostgreSQL stack to create a multi-layered caching system.

### The Data Flow:

1. The frontend calls a Zenith API route (e.g., `GET /api/presence/keywords/rankings`).
2. The backend route first checks the Redis cache for this data. If fresh data (e.g., < 1 hour old) exists, it is returned immediately.
3. If not in Redis, the backend queries our PostgreSQL database. If data from the last 24 hours exists, it is returned, and also added to the Redis cache for future requests.
4. If no recent data exists in the database, only then does our backend make a live, paid call to the external API (e.g., DataForSEO).
5. The fresh data from the API call is saved to our PostgreSQL database with a timestamp.
6. The data is also saved to the Redis cache with a 1-hour Time-to-Live (TTL).
7. The data is returned to the frontend.

### Required Database Schema Changes (Prisma)
We need to add new models to our schema.prisma file to store this historical data. This is also how we will track trends (e.g., trendingUp or trendingDown).

```prisma
// In schema.prisma

// --- CORE DATA MODELS ---

model KeywordRanking {
  id         String    @id @default(cuid())
  keyword    String
  position   Int
  volume     Int
  difficulty Int
  createdAt  DateTime  @default(now())
  clientId   String    // Foreign key to your User/Client model
  client     User      @relation(fields: [clientId], references: [id])
}

model LocalRankReport {
  id        String    @id @default(cuid())
  keyword   String
  location  String
  gridData  Json      // Storing the grid array as JSON
  createdAt DateTime  @default(now())
  clientId  String
  client    User      @relation(fields: [clientId], references: [id])
}

// --- PRESENCE COMMAND CENTER MODELS (NEW) ---

enum Service {
  GOOGLE
  FACEBOOK
  INSTAGRAM
  X
  LINKEDIN
}

// Securely stores encrypted OAuth tokens for third-party services
model ApiClientConnection {
  id            String   @id @default(cuid())
  service       Service  // e.g., GOOGLE, FACEBOOK
  accessToken   String   // Encrypted access token
  refreshToken  String?  // Encrypted refresh token
  expiresAt     DateTime?
  scopes        String[] // Scopes granted by the user
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  clientId String
  client   User   @relation(fields: [clientId], references: [id])

  @@unique([clientId, service])
}

enum ReviewPlatform {
  GMB
  YELP
  TRUSTPILOT
  FACEBOOK
}

// Generic model for reviews from any platform
model PlatformReview {
  id          String         @id @default(cuid())
  platform    ReviewPlatform // e.g., GMB, YELP
  platformId  String         @unique // The ID from the original platform
  author      String
  rating      Float
  text        String
  replied     Boolean        @default(false)
  reviewUrl   String         // Direct URL to the review
  createdAt   DateTime       @default(now())
  clientId    String
  client      User           @relation(fields: [clientId], references: [id])
}

enum SocialPlatform {
  FACEBOOK
  INSTAGRAM
  X
  LINKEDIN
}

// For the Unified Social Publisher
model SocialPost {
  id           String           @id @default(cuid())
  content      String
  platforms    SocialPlatform[]
  status       String           // e.g., DRAFT, SCHEDULED, PUBLISHED, FAILED
  scheduledAt  DateTime?        // The time the post is scheduled for
  publishedAt  DateTime?        // The time the post was actually published
  postResult   Json?            // Stores the result from the API (e.g., post URLs)
  createdAt    DateTime         @default(now())
  clientId     String
  client       User             @relation(fields: [clientId], references: [id])
}
```

## 4. Critical Integration & Operational Plan

To ensure a smooth integration with the existing, error-free SaaS project, the following operational steps are required.

### A. Environment and Credential Management
- **Secure Credential Vault**: All third-party API keys (DataForSEO master key, Google OAuth Client ID/Secret, etc.) must be stored using a dedicated secret management service like Doppler or Vercel's built-in Environment Variables. They should not be hardcoded or stored in .env files within the repository.

- **Staging Environment**: A dedicated staging environment must be created that mirrors the production setup. This environment will use test keys for all APIs to allow for end-to-end testing without incurring production costs or affecting live client data.

- **Configuration Schema**: A env.example file must be maintained with a clear list of all required environment variables, so new developers can set up their local environments correctly.

### B. Robust Error Handling & Logging
- **API Route Resilience**: Every internal API route that calls an external service must be wrapped in a try...catch block.

- **On Failure**: If an external API (e.g., DataForSEO) fails, the route should not crash. It should log the error to our monitoring service (Sentry, as per your project docs) and return a graceful error response to the frontend (e.g., 503 Service Unavailable with a message: "Could not retrieve live ranking data.").

- **Frontend State Management**: The frontend React components must be designed to handle these API errors gracefully. Instead of a crashing page, it should display a user-friendly error message within the specific widget (e.g., "Live data is temporarily unavailable. Displaying last saved results."). React Query's isError and error states are perfect for this.

### C. Security & Authorization Enhancements
- **OAuth Token Encryption**: All stored OAuth refresh tokens (for Google, Meta, etc.) in the PostgreSQL database must be encrypted at rest. This adds a critical layer of security in the unlikely event of a database breach.

- **Route Authorization**: Every internal API route must first validate the user's session (using getServerSession from next-auth as per your docs) before making any external API calls. Furthermore, it must verify that the authenticated user has the permission to access the specific resource (e.g., the GMB profile they are trying to fetch). This prevents one client from accessing another's data.

### D. Background Jobs & Data Freshness
- **Scheduled Tasks (Cron Jobs)**: To keep data fresh without relying solely on user interaction, we will implement serverless cron jobs (e.g., using Vercel Cron Jobs).

  - **Daily Job**: A job that runs once daily to fetch keyword rankings for all clients who have opted into the service. This ensures historical data is built up for trend analysis.
  
  - **Hourly Job**: A job that runs every few hours to fetch new GMB reviews and social media mentions. This keeps the "inbox" style feeds feeling responsive and live.

By implementing this architecture and operational plan, Zenith will have a secure, scalable, and cost-effective backend capable of delivering the live, accurate data that your premium clients expect. This technical foundation fully supports the advanced features of the Presence Command Center and solidifies Zenith's position as a market leader.

## 5. Client Portal & Experience Journey Blueprint

**Objective**: To design a cohesive, intuitive, and all-encompassing user experience for clients within the main Zenith SaaS application, transforming it into an indispensable command center for their entire digital presence.

### Section 1: The Command Center Dashboard (The "Mission Control")
This is the client's entry point and primary interface—a fully customizable "power engine" designed to be their 90-inch screen overview. It answers the question, "What is the live, holistic state of my entire online business?"

**Core UI Concept: Customizable & Modular Grid**

The dashboard is built on a dynamic grid system. Clients can drag, drop, and resize a variety of data widgets to create a dashboard layout that is perfectly tailored to their priorities and how they want to view their business. This directly addresses the need for a user-defined UI/UX.

**Core Widgets Library**:

- **Zenith Health Score**: The prominent, overarching score of their entire digital presence.

- **AI Opportunity Finder**: The feed of proactive, AI-driven strategic recommendations.

- **GEO & SEO Keyword Rankings**: A powerful widget showing a graph of historical keyword performance, a table of current rankings, search volume, and difficulty.

- **Local Rank Grid (Visual Map)**: The "Local Falcon" style grid, visually representing their GMB ranking for target keywords in their geographic area.

- **Unified Notifications & Task Inbox**: A central inbox that aggregates notifications from Zenith (e.g., "New task assigned"), Gmail (e.g., "Email from potential client"), GMB (e.g., "New review posted"), and social media mentions. This creates a single feed for all critical communications.

- **Integrated Team Calendar**: A full-featured calendar widget that displays project deadlines, scheduled social posts, and syncs two-way with their Google Calendar for meetings and events.

- **Live Analytics Suite**: A selection of graph and chart widgets for key metrics (e.g., website traffic, social engagement, conversion rates) that can be arranged as the client sees fit.

- **Module Snapshot Widgets**: The smaller "at-a-glance" cards for quick navigation into the deeper modules.

### Section 2: The Project Hub (The "Workshop")
This is where the strategic "what" from the dashboard and sandbox becomes the tactical "how." It remains the central space for collaboration and execution.

**UI Concept**: A powerful project management interface with Timeline (Gantt) and Task Board (Kanban) views.

**Core Components**:

- **Automated Task Generation**: When a client approves their Vision Sandbox blueprint, Zenith's AI agents automatically create a new project in this hub. Every recommendation becomes a pre-populated task.

- **Deliverable Tracking**: Every task requiring a file (e.g., "Upload new hero image," "Provide API key for Instagram") will have a dedicated upload slot that links directly to the Asset Library. This clearly shows what is needed from the client at every stage.

- **Centralized Communication**: A built-in chat/comment thread is attached to every task, keeping all communication, feedback, and approvals in context.

### Section 3: The Asset Library (The "Vault")
This is the single, secure source of truth for every digital asset and credential the client owns. This is the integration engine that powers the entire portal.

**UI Concept**: An intuitive, folder-based file manager, similar to Google Drive or Dropbox.

**Core Components**:

- **Media Storage**: Secure, cloud-based storage (leveraging AWS S3) for all client deliverables: images, videos, audio files, logos, documents.

- **Brand Kit**: A dedicated section where the client uploads their official logos, color palettes, and fonts. This kit can be used by the Vision Sandbox to automatically apply branding.

- **Credential Manager**: A highly secure, encrypted vault for storing all sensitive information: API keys, login details for social media, Google service account credentials, etc. This is the central hub for all integrations.

### Section 4: The Client Enablement Suite (The "Academy & Toolkit")
This section is designed to empower your clients, reduce support tickets, and keep them engaged with the platform. It's their personal toolkit for success.

**UI Concept**: A clean, organized resource center.

**Core Components**:

- **Zenith Academy**: A library of short, professional video tutorials and help articles covering both platform training ("How to customize your dashboard") and strategic education ("Understanding your Local Rank Score").

- **Shared Project Calendar**: An integrated calendar that automatically shows project milestones, scheduled posts, and syncs two-way with the client's Google Calendar for meetings and events.

- **Idea Notepad**: A simple, private digital notepad where clients can jot down ideas. The AI can scan these notes for keywords and suggest turning them into new Content Briefs.

By building out the Client Portal with these four interconnected pillars—centered on a powerful, customizable dashboard—you create a seamless journey and an indispensable ecosystem that becomes the true future of your client's business online.

## 6. Zenith - Phased Integration & Command Guide

**Objective**: To provide a clear, step-by-step command-line workflow for safely integrating the new Client Portal features from your feature/client-portal branch into the main branch.

### Prerequisites:

- Ensure your main branch is up-to-date: `git checkout main && git pull origin main`.
- Ensure your feature branch is also up-to-date with main: `git checkout feature/client-portal && git merge main`.
- All commands should be run from the root of your Zenith project directory.

### Phase 1: Integrate the Foundational Backend & Asset Library
**Goal**: Merge the core database schema changes and the UI for the Asset Library. This is the foundation everything else will be built on.

1. **Switch to your feature branch.**
   ```bash
   git checkout feature/client-portal
   ```

2. **Isolate the Database and Asset Library Commits.**
   Use `git log` to find the specific commit hashes related to the Prisma schema changes (ApiClientConnection, PlatformReview, SocialPost models) and the initial UI components for the "Asset Library".

3. **Create a new branch for this specific integration.**
   ```bash
   git checkout -b integration/phase1-backend
   ```

4. **Cherry-Pick the Commits.**
   Bring only the necessary commits from your feature branch into this new integration branch.
   ```bash
   # Replace <hash> with the actual commit hashes you found
   git cherry-pick <prisma_schema_commit_hash>
   git cherry-pick <asset_library_ui_commit_hash>
   ```

5. **Validate and Test.**
   - Apply the database migration: `pnpm prisma migrate dev`
   - Run all tests: `pnpm test`
   - Start the development server (`pnpm dev`) and manually verify that the new "Asset Library" page renders correctly and the database schema is updated.

6. **Merge to Main.**
   This is best done via a Pull Request (PR) on GitHub.
   - Push the integration branch: `git push -u origin integration/phase1-backend`
   - Go to GitHub and create a Pull Request from `integration/phase1-backend` to `main`.
   - After the PR is approved and merged, switch back to your main branch and pull the changes.
   ```bash
   git checkout main
   git pull origin main
   ```

### Phase 2: Integrate the Command Center Dashboard & Core Widgets
**Goal**: Add the main dashboard layout and the widgets that rely on the new backend infrastructure.

1. **Update your feature branch with the latest from main.**
   ```bash
   git checkout feature/client-portal
   git merge main
   ```

2. **Create a new integration branch.**
   ```bash
   git checkout -b integration/phase2-dashboard
   ```

3. **Cherry-Pick the Dashboard Commits.**
   Find and cherry-pick the commits related to:
   - The main dashboard layout (`/app/dashboard/page.tsx`).
   - The `PresenceCommandCenter.tsx` component.
   - The new API routes (e.g., `/api/presence/gmb/reviews`).
   - The Onboarding Wizard UI and logic.
   ```bash
   # Replace <hash> with the relevant commit hashes
   git cherry-pick <dashboard_layout_commit_hash>
   git cherry-pick <command_center_component_hash>
   git cherry-pick <api_routes_commit_hash>
   ```

4. **Validate and Test.**
   - Run all tests: `pnpm test`
   - Thoroughly test the dashboard UI. Verify that widgets display loading states correctly and then populate with live data by calling your new API routes. Test the Onboarding Wizard flow.

5. **Merge to Main via Pull Request.**
   - Push the branch: `git push -u origin integration/phase2-dashboard`
   - Create a PR on GitHub, get it reviewed, and merge.
   - Update your local main branch.

### Phase 3: Integrate the Project Hub & Enablement Suite
**Goal**: Merge the remaining portal features which are primarily UI-focused and build upon the previously merged backend.

1. **Update your feature branch again.**
   ```bash
   git checkout feature/client-portal
   git merge main
   ```

2. **Create the final integration branch.**
   ```bash
   git checkout -b integration/phase3-final-features
   ```

3. **Cherry-Pick the Remaining Commits.**
   This will include commits for:
   - The Project Hub UI (Timeline/Kanban views).
   - The automated task generation logic.
   - The Zenith Academy and other Enablement Suite components.
   ```bash
   # Cherry-pick the relevant commit hashes
   git cherry-pick <project_hub_ui_hash>
   git cherry-pick <enablement_suite_hash>
   ```

4. **Final Validation.**
   - Run all tests: `pnpm test`
   - Perform a full end-to-end test of the entire client portal experience, ensuring all new sections work together as expected.

5. **Merge to Main via Pull Request.**
   - Push the branch: `git push -u origin integration/phase3-final-features`
   - This is the final PR for the client portal. Perform a thorough review before merging.

By following this phased approach, you can methodically and safely integrate these complex enhancements, ensuring that your main branch remains stable and error-free throughout the process.
