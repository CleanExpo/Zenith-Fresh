#!/bin/bash

# Zenith Platform - Staging Environment Setup Script
# This script sets up the complete staging environment including Railway database

set -e  # Exit on error

echo "🚀 Zenith Platform - Staging Environment Setup"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
check_railway() {
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI not found!${NC}"
        echo "Please install Railway CLI: npm install -g @railway/cli"
        exit 1
    fi
    echo -e "${GREEN}✅ Railway CLI found${NC}"
}

# Check if required environment variables are set
check_env_vars() {
    local missing_vars=()
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        missing_vars+=("RAILWAY_TOKEN")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing environment variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        echo ""
        echo "Please set these variables before running this script."
        echo "Example: export RAILWAY_TOKEN=your_token_here"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Environment variables configured${NC}"
}

# Create Railway staging project
create_railway_project() {
    echo -e "\n${YELLOW}Creating Railway staging project...${NC}"
    
    # Create new Railway project for staging
    railway login --token $RAILWAY_TOKEN
    
    # Create project with staging name
    railway init --name "zenith-staging"
    
    echo -e "${GREEN}✅ Railway project created${NC}"
}

# Setup PostgreSQL database
setup_database() {
    echo -e "\n${YELLOW}Setting up PostgreSQL database...${NC}"
    
    # Add PostgreSQL plugin
    railway add postgresql
    
    # Get database URL
    echo -e "\n${YELLOW}Retrieving database credentials...${NC}"
    
    # Export Railway environment variables
    eval $(railway variables --json | jq -r 'to_entries[] | "export \(.key)=\"\(.value)\""')
    
    # Save database URLs
    echo "DATABASE_URL=$DATABASE_URL" > .env.staging.local
    echo "POSTGRES_PRISMA_URL=$DATABASE_URL?pgbouncer=true&connect_timeout=15" >> .env.staging.local
    echo "POSTGRES_URL_NON_POOLING=$DATABASE_URL" >> .env.staging.local
    echo "DIRECT_URL=$DATABASE_URL" >> .env.staging.local
    
    echo -e "${GREEN}✅ Database configured${NC}"
}

# Run database migrations
run_migrations() {
    echo -e "\n${YELLOW}Running database migrations...${NC}"
    
    # Load staging environment
    export $(cat .env.staging.local | xargs)
    
    # Generate Prisma client
    npx prisma generate
    
    # Push schema to database
    npx prisma db push --accept-data-loss
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Seed staging data
seed_staging_data() {
    echo -e "\n${YELLOW}Seeding staging database...${NC}"
    
    # Create staging data seed script
    cat > scripts/staging/seed-staging.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding staging database...');

  // Create test users
  const testUsers = [
    {
      email: 'admin@staging.zenith.engineer',
      name: 'Staging Admin',
      password: 'staging_admin_2024!',
      role: 'ADMIN'
    },
    {
      email: 'user@staging.zenith.engineer',
      name: 'Test User',
      password: 'test_user_2024!',
      role: 'USER'
    },
    {
      email: 'beta@staging.zenith.engineer',
      name: 'Beta Tester',
      password: 'beta_tester_2024!',
      role: 'USER'
    }
  ];

  for (const userData of testUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      }
    });

    console.log(`✅ Created user: ${user.email}`);
  }

  // Create test projects
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@staging.zenith.engineer' }
  });

  if (adminUser) {
    const testProjects = [
      {
        name: 'Staging Test Project 1',
        description: 'Test project for staging environment',
        userId: adminUser.id
      },
      {
        name: 'Feature Flag Demo Project',
        description: 'Demonstrates feature flag functionality',
        userId: adminUser.id
      }
    ];

    for (const projectData of testProjects) {
      const project = await prisma.project.create({
        data: projectData
      });
      console.log(`✅ Created project: ${project.name}`);
    }
  }

  console.log('✅ Staging database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

    # Run seed script
    node scripts/staging/seed-staging.js
    
    echo -e "${GREEN}✅ Staging data seeded${NC}"
}

# Generate staging environment summary
generate_summary() {
    echo -e "\n${GREEN}🎉 Staging Environment Setup Complete!${NC}"
    echo "======================================"
    echo ""
    echo "📋 Summary:"
    echo "- Railway Project: zenith-staging"
    echo "- Database: PostgreSQL (Railway)"
    echo "- Environment File: .env.staging.local"
    echo ""
    echo "👤 Test Users:"
    echo "- admin@staging.zenith.engineer / staging_admin_2024!"
    echo "- user@staging.zenith.engineer / test_user_2024!"
    echo "- beta@staging.zenith.engineer / beta_tester_2024!"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Copy .env.staging.local values to Vercel staging environment"
    echo "2. Push staging branch to trigger deployment"
    echo "3. Configure staging domain in Vercel"
    echo ""
    echo "📝 Important Files Created:"
    echo "- .env.staging.local (Database credentials)"
    echo "- scripts/staging/seed-staging.js (Seeding script)"
    echo ""
    echo -e "${YELLOW}⚠️  Keep .env.staging.local secure and never commit it!${NC}"
}

# Main execution
main() {
    echo "Starting staging environment setup..."
    
    check_railway
    check_env_vars
    create_railway_project
    setup_database
    run_migrations
    seed_staging_data
    generate_summary
}

# Run main function
main