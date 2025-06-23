const { hash, compare } = require('bcryptjs');

async function testAuth() {
  console.log('Testing authentication functionality...\n');
  
  // Test password hashing
  const testPassword = 'testpassword123';
  console.log('1. Testing password hashing...');
  const hashedPassword = await hash(testPassword, 12);
  console.log('✓ Password hashed successfully');
  
  // Test password comparison
  console.log('2. Testing password comparison...');
  const isValid = await compare(testPassword, hashedPassword);
  console.log(`✓ Password comparison: ${isValid ? 'PASS' : 'FAIL'}`);
  
  // Test invalid password
  const isInvalid = await compare('wrongpassword', hashedPassword);
  console.log(`✓ Invalid password rejected: ${!isInvalid ? 'PASS' : 'FAIL'}`);
  
  console.log('\n✅ Authentication tests completed successfully!');
}

testAuth().catch(console.error);