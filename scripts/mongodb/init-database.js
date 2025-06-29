#!/usr/bin/env node

/**
 * MongoDB Database Initialization Script
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Creates necessary indexes
 * 3. Seeds initial data if needed
 * 4. Verifies the setup
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'zenith_production';

if (!uri) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function initializeDatabase() {
  let client;
  
  try {
    console.log('🚀 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    console.log(`✅ Connected to database: ${dbName}`);
    
    // Test connection
    await db.admin().ping();
    console.log('✅ MongoDB ping successful');
    
    // Create indexes
    console.log('📊 Creating database indexes...');
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    console.log('  ✅ Users indexes created');
    
    // Projects collection indexes
    await db.collection('projects').createIndex({ userId: 1 });
    await db.collection('projects').createIndex({ createdAt: -1 });
    await db.collection('projects').createIndex({ url: 1 });
    console.log('  ✅ Projects indexes created');
    
    // Website analyses indexes
    await db.collection('website_analyses').createIndex({ projectId: 1 });
    await db.collection('website_analyses').createIndex({ createdAt: -1 });
    await db.collection('website_analyses').createIndex({ url: 1 });
    console.log('  ✅ Website analyses indexes created');
    
    // Teams indexes
    await db.collection('teams').createIndex({ ownerId: 1 });
    await db.collection('teams').createIndex({ 'members.userId': 1 });
    console.log('  ✅ Teams indexes created');
    
    // Audit logs indexes
    await db.collection('audit_logs').createIndex({ userId: 1 });
    await db.collection('audit_logs').createIndex({ timestamp: -1 });
    await db.collection('audit_logs').createIndex({ action: 1 });
    console.log('  ✅ Audit logs indexes created');
    
    // Create demo user if it doesn't exist
    console.log('👤 Checking for demo user...');
    const demoEmail = 'zenithfresh25@gmail.com';
    const existingUser = await db.collection('users').findOne({ email: demoEmail });
    
    if (!existingUser) {
      console.log('👤 Creating demo user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('F^bf35(llm1120!2a', 12);
      
      await db.collection('users').insertOne({
        name: 'Zenith Demo User',
        email: demoEmail,
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('  ✅ Demo user created');
    } else {
      console.log('  ✅ Demo user already exists');
    }
    
    // Get database statistics
    console.log('📊 Database statistics:');
    const stats = await db.stats();
    console.log(`  📁 Collections: ${stats.collections}`);
    console.log(`  📄 Documents: ${stats.objects}`);
    console.log(`  💾 Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  🔍 Index size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('🎉 MongoDB initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the initialization
initializeDatabase();