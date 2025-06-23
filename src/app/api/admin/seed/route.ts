import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  return await seedDatabase();
}

export async function POST(req: NextRequest) {
  return await seedDatabase();
}

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with admin user...');

    // First, clear all existing users to ensure only this one exists
    await prisma.user.deleteMany({});
    console.log('✅ Cleared existing users');

    // Hash the password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'defaultPassword123', 12);

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

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
