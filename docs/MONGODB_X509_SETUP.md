# MongoDB Atlas X.509 Certificate Authentication Setup

This guide explains how to set up X.509 certificate authentication with MongoDB Atlas for enhanced security in production environments.

## Overview

MongoDB Atlas supports two types of X.509 authentication:
1. **Atlas-managed X.509 certificates** - Generated and managed by MongoDB Atlas
2. **Self-managed X.509 certificates** - You provide your own Certificate Authority (CA)

## Prerequisites

- MongoDB Atlas project with appropriate permissions (Organization Owner or Project Owner)
- Understanding of PKI (Public Key Infrastructure) for self-managed certificates
- Client application with MongoDB Node.js driver

## Setup Process

### Step 1: Enable X.509 Authentication in Atlas

1. **Navigate to Atlas Dashboard**
   - Log into MongoDB Atlas
   - Select your organization and project
   - Go to **Security > Advanced**

2. **Enable Self-Managed X.509 Authentication**
   - Toggle "Self-Managed X.509 Authentication" to **ON**
   - This enables certificate-based authentication for your project

### Step 2: Configure Certificate Authority (CA)

You can provide a Certificate Authority in two ways:

#### Option A: Upload CA File
- Click **Upload** and select your `.pem` CA file
- Click **Save**

#### Option B: Paste CA Content  
- Copy the contents of your `.pem` CA file
- Paste into the provided text area
- Click **Save**

**Note**: You can concatenate multiple CAs in the same `.pem` file. Users can authenticate with certificates generated by any of the provided CAs.

### Step 3: Create Database User with Certificate

1. **Go to Database Access**
   - Navigate to **Security > Database Access**
   - Click **Add New Database User**

2. **Configure Certificate Authentication**
   - Select **CERTIFICATE** as the authentication method
   - Enter the **Distinguished Name (DN)** from your client certificate

3. **Distinguished Name Format**
   ```
   CN=client,OU=users,O=YourOrganization,L=City,ST=State,C=US
   ```

   **Supported DN Fields:**
   - `CN` (Common Name) - Required
   - `OU` (Organizational Unit)
   - `O` (Organization)  
   - `L` (Locality/City)
   - `ST` (State/Province)
   - `C` (Country - 2-letter ISO code)
   - And many more (see MongoDB documentation for complete list)

4. **Assign Database Privileges**
   - Select appropriate roles (Atlas admin, Read/Write, Custom roles)
   - Specify database-level permissions as needed
   - Click **Add User**

### Step 4: Configure Client Connection

#### For Atlas-Managed X.509 (Recommended)

The simplest approach using connection string authentication:

```javascript
const uri = "mongodb+srv://zenith.gun3yny.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Zenith";

const client = new MongoClient(uri, {
  tls: true
});
```

#### For Self-Managed X.509 (Advanced)

When you manage your own certificates:

```javascript
const fs = require('fs');

const uri = "mongodb+srv://zenith.gun3yny.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Zenith";

const client = new MongoClient(uri, {
  tls: true,
  tlsCertificateKeyFile: './certificates/client.pem',
  tlsCAFile: './certificates/ca.pem',
  tlsAllowInvalidCertificates: false
});
```

### Step 5: Environment Variables

Update your `.env` file:

```env
# MongoDB X.509 Certificate Authentication
MONGODB_URI="mongodb+srv://zenith.gun3yny.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Zenith"
MONGODB_DB_NAME="zenith_production"

# Optional: For self-managed certificates
MONGODB_SSL_CERT_PATH="./certificates/client.pem"
MONGODB_SSL_CA_PATH="./certificates/ca.pem"
```

## Testing the Connection

Use the provided script to test your MongoDB connection:

```bash
npm run mongodb:init
```

This will verify:
- MongoDB connection establishment
- Certificate authentication
- Database access permissions
- Index creation capabilities

## Security Considerations

### Certificate Management
- **Expiration Monitoring**: Atlas automatically creates alerts 30 days before CA expiration
- **Certificate Rotation**: Plan for regular certificate rotation
- **Secure Storage**: Store certificate files securely and exclude from version control

### Network Security
- **IP Whitelisting**: Configure Atlas IP access lists
- **VPC Peering**: Use VPC peering for enhanced network security
- **Private Endpoints**: Consider Atlas private endpoints for production

### Access Control
- **Principle of Least Privilege**: Grant minimum required database permissions
- **Regular Audits**: Monitor database access logs
- **User Management**: Regularly review and update database users

## Troubleshooting

### Common Issues

1. **Certificate Validation Failed**
   ```
   MongoServerError: certificate validation failed
   ```
   - Verify certificate is properly formatted PEM
   - Check Distinguished Name matches Atlas user
   - Ensure certificate is not expired

2. **Authentication Failed**
   ```
   MongoServerError: authentication failed
   ```
   - Verify user exists in Atlas with correct DN
   - Check authSource is set to $external
   - Confirm authMechanism is MONGODB-X509

3. **Connection Timeout**
   - Check network connectivity
   - Verify Atlas IP whitelist configuration
   - Confirm cluster is running

### Debug Steps

1. **Verify Certificate Details**
   ```bash
   openssl x509 -in client.pem -text -noout
   ```

2. **Check Certificate Subject**
   ```bash
   openssl x509 -in client.pem -subject -noout
   ```

3. **Test Basic Connectivity**
   ```bash
   mongosh "mongodb+srv://cluster.mongodb.net" --tls --tlsCertificateKeyFile client.pem
   ```

## Migration from Username/Password

1. **Gradual Migration**
   - Keep existing username/password users during transition
   - Add certificate users alongside existing authentication
   - Test thoroughly before removing old authentication

2. **Fallback Strategy**
   - Maintain emergency access with username/password
   - Document rollback procedures
   - Monitor authentication patterns

## Best Practices

1. **Certificate Organization**
   - Use meaningful Common Names
   - Follow consistent DN patterns
   - Document certificate purposes

2. **Automation**
   - Automate certificate deployment
   - Script certificate renewal processes
   - Monitor certificate health

3. **Documentation**
   - Document all certificate procedures
   - Maintain certificate inventory
   - Train team on X.509 processes

## Resources

- [MongoDB Atlas X.509 Documentation](https://www.mongodb.com/docs/atlas/security-self-managed-x509/)
- [MongoDB Manual: X.509 Authentication](https://www.mongodb.com/docs/manual/core/security-x.509/)
- [RFC 4514: Distinguished Names](https://www.rfc-editor.org/rfc/rfc4514)

---

**Setup Script**: Run `npm run mongodb:setup-x509` for interactive setup assistance.