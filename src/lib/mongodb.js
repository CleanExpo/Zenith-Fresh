const { MongoClient } = require('mongodb');

const dbName = process.env.MONGODB_DB_NAME || 'zenith_production';

let client;
let clientPromise;

// Lazy initialization of MongoDB connection to avoid build-time errors
function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not configured');
  }
  return uri;
}

function initializeMongoClient() {
  if (clientPromise) {
    return clientPromise;
  }

  const uri = getMongoUri();

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

  return clientPromise;
}

// Utility function to get database
async function getDatabase() {
  const clientPromise = initializeMongoClient();
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
    const clientPromise = initializeMongoClient();
    const client = await clientPromise;
    await client.db().admin().ping();
    return { status: 'connected', message: 'MongoDB connection successful' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

module.exports = { 
  get clientPromise() {
    return initializeMongoClient();
  },
  dbName, 
  getDatabase, 
  getCollection, 
  checkMongoConnection 
};
