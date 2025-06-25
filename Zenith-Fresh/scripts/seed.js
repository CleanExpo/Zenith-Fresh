const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo user
  const demoUserEmail = 'zenithfresh25@gmail.com'
  const demoUserPassword = 'F^bf35(llm1120!2a'

  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: demoUserEmail }
    })

    if (existingUser) {
      console.log('✅ Demo user already exists')
    } else {
      const hashedPassword = await bcrypt.hash(demoUserPassword, 12)
      
      const demoUser = await prisma.user.create({
        data: {
          email: demoUserEmail,
          name: 'Demo User',
          password: hashedPassword,
          role: 'admin'
        }
      })

      console.log('✅ Demo user created:', demoUser.email)
    }

    // Create a sample project for the demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: demoUserEmail }
    })

    if (demoUser) {
      const existingProject = await prisma.project.findFirst({
        where: { userId: demoUser.id }
      })

      if (!existingProject) {
        const sampleProject = await prisma.project.create({
          data: {
            name: 'Sample Website Analysis',
            url: 'https://example.com',
            description: 'A sample project for testing the website health analyzer',
            userId: demoUser.id
          }
        })

        console.log('✅ Sample project created:', sampleProject.name)
      } else {
        console.log('✅ Sample project already exists')
      }
    }

    // Create initial audit log
    await prisma.auditLog.create({
      data: {
        action: 'DATABASE_SEEDED',
        details: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        },
        userId: demoUser?.id
      }
    })

    console.log('✅ Database seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })