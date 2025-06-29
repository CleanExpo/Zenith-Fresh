import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'zenith_production';

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env file');
}

let client;
let clientPromise;

// MongoDB connection options
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

// Add SSL certificate configuration for X.509 authentication if needed
if (uri.includes('authMechanism=MONGODB-X509')) {
  console.log('🔐 Using X.509 certificate authentication');
  
  // Check for certificate files
  if (process.env.MONGODB_SSL_CERT_PATH) {
    const fs = require('fs');
    try {
      options.sslCert = fs.readFileSync(process.env.MONGODB_SSL_CERT_PATH);
      if (process.env.MONGODB_SSL_KEY_PATH) {
        options.sslKey = fs.readFileSync(process.env.MONGODB_SSL_KEY_PATH);
      }
      if (process.env.MONGODB_SSL_CA_PATH) {
        options.sslCA = fs.readFileSync(process.env.MONGODB_SSL_CA_PATH);
      }
      console.log('✅ SSL certificates loaded for X.509 authentication');
    } catch (error) {
      console.warn('⚠️ Warning: X.509 certificates not found:', error.message);
      console.warn('Falling back to connection string authentication');
    }
  } else {
    console.warn('⚠️ Warning: MONGODB_SSL_CERT_PATH not specified for X.509 authentication');
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
export { clientPromise, dbName };

// Utility function to get database
export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}

// Utility function to get a specific collection
export async function getCollection(collectionName) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

// Health check function
export async function checkMongoConnection() {
  try {
    const client = await clientPromise;
    await client.db().admin().ping();
    return { status: 'connected', message: 'MongoDB connection successful' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}