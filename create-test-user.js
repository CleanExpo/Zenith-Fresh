const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('Creating test user for authentication testing...\n');
  
  try {
    await prisma.$connect();
    
    const testEmail = 'test@zenith.engineer';
    const testPassword = 'testpass123';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    
    if (existingUser) {
      console.log('✓ Test user already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
      });
      return;
    }
    
    // Create test user
    const hashedPassword = await hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: testEmail,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    
    console.log('✅ Test user created successfully:', user);
    
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
    
    // Create welcome notification
    await prisma.notification.create({
      data: {
        type: 'welcome',
        message: `Welcome to Zenith Platform, ${user.name}! This is a test account.`,
        userId: user.id,
      },
    });
    
    console.log('✅ Welcome notification created');
    
    console.log('\n🎉 Test user setup complete!');
    console.log('📧 Email: test@zenith.engineer');
    console.log('🔑 Password: testpass123');
    console.log('🔗 Test at: https://zenith.engineer/auth/signin');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();