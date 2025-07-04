const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'zenith_production';

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env file');
}

let client;
let clientPromise;

// MongoDB connection options
const options = {};

// Configure X.509 certificate authentication if specified
if (uri.includes('authMechanism=MONGODB-X509')) {
  console.log('🔐 Using MongoDB X.509 certificate authentication');
  
  // For X.509 authentication, certificates can be embedded in the connection string
  // or provided as separate files. MongoDB Atlas typically uses connection string auth.
  
  // Check for certificate files (optional for self-managed certificates)
  if (process.env.MONGODB_SSL_CERT_PATH) {
    const fs = require('fs');
    try {
      // Read client certificate (contains both cert and key for MongoDB)
      const certData = fs.readFileSync(process.env.MONGODB_SSL_CERT_PATH);
      options.tlsCertificateKeyFile = process.env.MONGODB_SSL_CERT_PATH;
      
      // Optional: Read CA certificate for additional validation
      if (process.env.MONGODB_SSL_CA_PATH) {
        options.tlsCAFile = process.env.MONGODB_SSL_CA_PATH;
      }
      
      // Enable TLS/SSL
      options.tls = true;
      options.tlsAllowInvalidCertificates = false; // Ensure certificate validation
      
      console.log('✅ X.509 certificate files loaded successfully');
    } catch (error) {
      console.warn('⚠️ Warning: X.509 certificate files not found:', error.message);
      console.log('Continuing with connection string authentication...');
    }
  } else {
    console.log('📝 Using X.509 authentication via connection string (Atlas managed)');
    // For Atlas-managed X.509, the certificate is handled by the connection string
    options.tls = true;
  }
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.

// Utility function to get database
async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

// Utility function to get a specific collection
async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

// Health check function
async function checkMongoConnection() {
  try {
    const client = await clientPromise;
    await client.db().admin().ping();
    return { status: 'connected', message: 'MongoDB connection successful' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

module.exports = { 
  clientPromise, 
  dbName, 
  getDatabase, 
  getCollection, 
  checkMongoConnection 
};