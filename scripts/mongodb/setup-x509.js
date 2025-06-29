#!/usr/bin/env node

/**
 * MongoDB X.509 Certificate Setup Script
 * 
 * This script helps you configure X.509 certificate authentication for MongoDB Atlas.
 * 
 * Prerequisites:
 * 1. Download your client certificate from MongoDB Atlas
 * 2. Place certificate files in a secure location
 * 3. Update environment variables
 * 
 * Usage:
 * node scripts/mongodb/setup-x509.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 MongoDB X.509 Certificate Authentication Setup');
console.log('================================================\n');

const certDir = path.join(process.cwd(), 'certificates');

// Check if certificates directory exists
if (!fs.existsSync(certDir)) {
  console.log('📁 Creating certificates directory...');
  fs.mkdirSync(certDir, { recursive: true });
  
  // Add to .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const gitignoreContent = fs.existsSync(gitignorePath) 
    ? fs.readFileSync(gitignorePath, 'utf8') 
    : '';
    
  if (!gitignoreContent.includes('certificates/')) {
    fs.appendFileSync(gitignorePath, '\n# MongoDB Certificates\ncertificates/\n');
    console.log('✅ Added certificates/ to .gitignore');
  }
}

console.log('📋 X.509 Certificate Setup Instructions:');
console.log('=========================================\n');

console.log('1. Download certificates from MongoDB Atlas:');
console.log('   - Go to your MongoDB Atlas cluster');
console.log('   - Navigate to Security > Advanced');
console.log('   - Download the client certificate files');
console.log('');

console.log('2. Place certificate files in the certificates/ directory:');
console.log('   - client.pem (client certificate)');
console.log('   - client-key.pem (client private key)');
console.log('   - ca.pem (certificate authority)');
console.log('');

console.log('3. Update your .env file with these variables:');
console.log('');
console.log('# MongoDB X.509 Certificate Authentication');
console.log('MONGODB_URI="mongodb+srv://zenith.gun3yny.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Zenith"');
console.log('MONGODB_SSL_CERT_PATH="./certificates/client.pem"');
console.log('MONGODB_SSL_KEY_PATH="./certificates/client-key.pem"');
console.log('MONGODB_SSL_CA_PATH="./certificates/ca.pem"');
console.log('MONGODB_DB_NAME="zenith_production"');
console.log('');

console.log('4. Test the connection:');
console.log('   npm run mongodb:init');
console.log('');

// Check if certificate files exist
const requiredFiles = [
  { name: 'client.pem', path: path.join(certDir, 'client.pem') },
  { name: 'client-key.pem', path: path.join(certDir, 'client-key.pem') },
  { name: 'ca.pem', path: path.join(certDir, 'ca.pem') }
];

console.log('📊 Certificate Files Status:');
console.log('============================');

let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  console.log(`${exists ? '✅' : '❌'} ${file.name}: ${exists ? 'Found' : 'Missing'}`);
  if (!exists) allFilesExist = false;
});

if (allFilesExist) {
  console.log('\n🎉 All certificate files found!');
  console.log('📝 You can now update your .env file and test the X.509 connection.');
} else {
  console.log('\n⚠️  Certificate files missing.');
  console.log('📥 Please download and place the certificate files in the certificates/ directory.');
}

console.log('\n🔗 MongoDB Atlas X.509 Documentation:');
console.log('https://docs.atlas.mongodb.com/security-x509-auth/');