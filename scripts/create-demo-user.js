const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    const demoEmail = 'zenithfresh25@gmail.com';
    const demoPassword = 'F^bf35(llm1120!2a';

    console.log('🔍 Checking if demo user exists...');
    
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (existingUser) {
      console.log('✅ Demo user already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      });
      return;
    }

    console.log('👤 Creating demo user...');
    
    // Create demo user
    const hashedPassword = await bcrypt.hash(demoPassword, 12);
    
    const user = await prisma.user.create({
      data: {
        name: 'Demo Admin User',
        email: demoEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('✅ Demo user created:', user);

    // Create user preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
        theme: 'system',
        emailNotifications: true,
        pushNotifications: true,
      },
    });

    console.log('✅ User preferences created');

    // Log the creation
    await prisma.activityLog.create({
      data: {
        action: 'demo_user_created',
        details: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          role: user.role,
        }),
        userId: user.id,
      },
    });

    console.log('✅ Activity log created');
    console.log('\n🎉 Demo user setup complete!');
    console.log('📧 Email:', demoEmail);
    console.log('🔐 Password:', demoPassword);

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();