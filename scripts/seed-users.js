const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');

  // Admin user with zenithfresh25@gmail.com
  const adminPassword = await bcrypt.hash('F^bf35(llm1120!2a', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'zenithfresh25@gmail.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'zenithfresh25@gmail.com',
      password: adminPassword,
      name: 'Zenith Admin',
      role: 'ADMIN',
    },
  });

  // Alternative admin user
  const altAdminPassword = await bcrypt.hash('password123', 12);
  const altAdminUser = await prisma.user.upsert({
    where: { email: 'admin@zenith.com' },
    update: {
      password: altAdminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@zenith.com',
      password: altAdminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Test developer user
  const devPassword = await bcrypt.hash('password123', 12);
  const devUser = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {
      password: devPassword,
      role: 'USER',
    },
    create: {
      email: 'john.doe@example.com',
      password: devPassword,
      name: 'John Doe',
      role: 'USER',
    },
  });

  // Create user preferences for admin
  await prisma.userPreferences.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      theme: 'dark',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: altAdminUser.id },
    update: {},
    create: {
      userId: altAdminUser.id,
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
    },
  });

  console.log('✅ Users seeded successfully!');
  console.log('📧 Admin Email: zenithfresh25@gmail.com');
  console.log('🔑 Admin Password: F^bf35(llm1120!2a');
  console.log('📧 Alt Admin Email: admin@zenith.com');
  console.log('🔑 Alt Admin Password: password123');
  console.log('📧 Test User Email: john.doe@example.com');
  console.log('🔑 Test User Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
