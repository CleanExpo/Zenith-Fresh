# Build stage
FROM node:18.20.8-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Install additional dependencies
RUN npm install lucide-react @radix-ui/react-select prom-client
RUN npm install --save-dev @types/prom-client

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=https://goggasvuqbcyaetpitrm.supabase.co
ENV NEXT_PUBLIC_APP_URL=https://zenith.engineer
ENV NEXT_PUBLIC_APP_NAME="Zenith Platform"
ENV NEXT_PUBLIC_APP_VERSION=1.0.0
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:18.20.8-alpine AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the Next.js build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]