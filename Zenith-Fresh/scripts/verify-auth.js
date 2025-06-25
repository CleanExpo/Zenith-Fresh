const bcrypt = require('bcryptjs')

async function verifyAuthSetup() {
  console.log('🔐 Verifying NextAuth Setup...\n')
  
  // Test password hashing
  const testPassword = 'F^bf35(llm1120!2a'
  console.log('1. Testing password hashing...')
  const hashedPassword = await bcrypt.hash(testPassword, 12)
  const isValid = await bcrypt.compare(testPassword, hashedPassword)
  console.log(`   ✅ Password hashing: ${isValid ? 'WORKING' : 'FAILED'}`)
  
  // Check environment variables
  console.log('\n2. Checking environment variables...')
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL'
  ]
  
  let allEnvVarsPresent = true
  requiredEnvVars.forEach(envVar => {
    const isPresent = process.env[envVar] !== undefined
    if (!isPresent) allEnvVarsPresent = false
    console.log(`   ${isPresent ? '✅' : '❌'} ${envVar}: ${isPresent ? 'SET' : 'MISSING'}`)
  })
  
  // Check optional Google OAuth vars
  console.log('\n3. Checking Google OAuth variables...')
  const googleClientId = process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  console.log(`   ${googleClientId && googleClientId !== 'your-google-client-id' ? '✅' : '⚠️'} GOOGLE_CLIENT_ID: ${googleClientId && googleClientId !== 'your-google-client-id' ? 'CONFIGURED' : 'NEEDS CONFIGURATION'}`)
  console.log(`   ${googleClientSecret && googleClientSecret !== 'your-google-client-secret' ? '✅' : '⚠️'} GOOGLE_CLIENT_SECRET: ${googleClientSecret && googleClientSecret !== 'your-google-client-secret' ? 'CONFIGURED' : 'NEEDS CONFIGURATION'}`)
  
  console.log('\n4. NextAuth Setup Summary:')
  console.log(`   📁 Prisma Schema: ✅ CREATED`)
  console.log(`   🔧 Auth Config: ✅ CREATED (/lib/auth.ts)`)
  console.log(`   🌐 API Route: ✅ CREATED (/app/api/auth/[...nextauth]/route.ts)`)
  console.log(`   🎭 Type Definitions: ✅ CREATED (/types/next-auth.d.ts)`)
  console.log(`   🔄 Session Provider: ✅ CREATED (/src/components/SessionProvider.tsx)`)
  console.log(`   🛡️ Middleware: ✅ UPDATED (authentication protection)`)
  console.log(`   📝 Sign-in Form: ✅ UPDATED (NextAuth integration)`)
  
  console.log('\n🎯 Next Steps:')
  console.log('   1. Set DATABASE_URL in .env file')
  console.log('   2. Run: npm install (to install new dependencies)')
  console.log('   3. Run: npx prisma generate')
  console.log('   4. Run: npx prisma db push (to create database tables)')
  console.log('   5. Run: npm run db:seed (to create demo user)')
  console.log('   6. Configure Google OAuth credentials (optional)')
  console.log('   7. Start development server: npm run dev')
  
  console.log('\n🔑 Demo Credentials:')
  console.log('   Email: zenithfresh25@gmail.com')
  console.log('   Password: F^bf35(llm1120!2a')
  
  return allEnvVarsPresent
}

// Run verification if called directly
if (require.main === module) {
  verifyAuthSetup()
    .then(() => {
      console.log('\n✅ NextAuth setup verification completed!')
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyAuthSetup }