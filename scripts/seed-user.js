const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with admin user...');

  // First, clear all existing users to ensure only this one exists
  await prisma.user.deleteMany({});
  console.log('✅ Cleared existing users');

  // Hash the password
  const hashedPassword = await bcrypt.hash('F^bf35(llm1120!2a', 12);

  // Create the admin user
  const user = await prisma.user.create({
    data: {
      email: 'Zenithfresh25@gmail.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', user.email);
  console.log('📧 Email: Zenithfresh25@gmail.com');
  console.log('🔑 Password: F^bf35(llm1120!2a');
  console.log('🎯 This is now the ONLY way to access the application');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
