const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseAuth() {
  console.log('Testing database authentication...\n');
  
  try {
    // Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    
    // Test user creation
    console.log('2. Testing user creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const hashedPassword = await hash('testpassword123', 12);
    
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
    
    console.log('✓ User created successfully:', user);
    
    // Test user lookup
    console.log('3. Testing user lookup...');
    const foundUser = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });
    
    console.log('✓ User found successfully:', { 
      id: foundUser.id, 
      name: foundUser.name, 
      email: foundUser.email,
      hasPassword: !!foundUser.password 
    });
    
    // Clean up test user
    console.log('4. Cleaning up test user...');
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log('✓ Test user cleaned up');
    
    console.log('\n✅ Database authentication tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseAuth();