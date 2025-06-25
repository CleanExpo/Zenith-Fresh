const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const demoEmail = 'zenithfresh25@gmail.com';
    const demoPassword = 'F^bf35(llm1120!2a';

    console.log('🔍 Testing password for demo user...');
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
    });

    // Test password comparison
    const isValid = await bcrypt.compare(demoPassword, user.password);
    
    console.log('🔐 Password test result:', isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      console.log('🔄 Re-hashing password with correct hash...');
      
      const newHash = await bcrypt.hash(demoPassword, 12);
      
      await prisma.user.update({
        where: { email: demoEmail },
        data: { password: newHash },
      });
      
      console.log('✅ Password updated with fresh hash');
      
      // Test again
      const isValidNow = await bcrypt.compare(demoPassword, newHash);
      console.log('🔐 Updated password test:', isValidNow ? '✅ VALID' : '❌ STILL INVALID');
    }

  } catch (error) {
    console.error('❌ Error testing password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();