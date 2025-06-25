# Production Security Hardening Checklist

## Overview

This comprehensive security hardening checklist ensures the Zenith Platform meets enterprise-grade security standards, protecting against common vulnerabilities and implementing defense-in-depth strategies.

## 🛡️ Security Framework

### Security Architecture
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   WAF/CDN       │───▶│ Load Balancer│───▶│ Application     │
│ (DDoS/Filter)   │    │ (Rate Limit) │    │ (Auth/RBAC)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Network Security│    │ Data Security│    │ Monitor/Audit   │
│ (Firewall/VPN)  │    │ (Encrypt/Key)│    │ (SIEM/Alerts)   │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Identity & Auth │    │ Vulnerability│    │ Incident Resp.  │
│ (IAM/MFA/SSO)   │    │ Management   │    │ (SOAR/Recovery) │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

### Security Principles
1. **Zero Trust Architecture**: Never trust, always verify
2. **Defense in Depth**: Multiple layers of security controls
3. **Principle of Least Privilege**: Minimum necessary access
4. **Security by Design**: Security integrated from the start
5. **Continuous Monitoring**: Real-time threat detection

## 🔐 Application Security Hardening

### 1. Authentication and Authorization

**Next.js Authentication Security:**
```typescript
// lib/security/auth-security.ts
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { createHash, timingSafeEqual } from 'crypto';

// Secure password hashing
export const hashPassword = async (password: string): Promise<string> => {
  // Use strong salt rounds (12+ for production)
  const saltRounds = 14;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  
  // Custom key generator to include user identifier
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  },
  
  // Skip rate limiting for trusted IPs
  skip: (req) => {
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIPs.includes(req.ip);
  }
});

// Session security configuration
export const sessionConfig = {
  name: 'zenith_session',
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const
  },
  
  // Rolling sessions
  rolling: true,
  
  // Session regeneration on login
  genid: () => {
    return require('crypto').randomBytes(32).toString('hex');
  }
};

// JWT security configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: '1h',
  issuer: 'zenith-platform',
  audience: 'zenith-users',
  algorithm: 'HS256' as const,
  
  // Anti-tampering
  verify: (token: string, secret: string) => {
    try {
      return jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'zenith-platform',
        audience: 'zenith-users'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
};
```

**Multi-Factor Authentication (MFA):**
```typescript
// lib/security/mfa.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class MFAService {
  generateSecret(userEmail: string) {
    const secret = speakeasy.generateSecret({
      name: `Zenith Platform (${userEmail})`,
      issuer: 'Zenith Platform',
      length: 32
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (±60 seconds)
      time: Math.floor(Date.now() / 1000)
    });
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(
        require('crypto')
          .randomBytes(4)
          .toString('hex')
          .toUpperCase()
          .match(/.{2}/g)!
          .join('-')
      );
    }
    return codes;
  }
}

// Environment Variables for MFA
MFA_ENABLED=true
MFA_ISSUER="Zenith Platform"
MFA_BACKUP_CODES_COUNT=10
```

### 2. Input Validation and Sanitization

**Comprehensive Input Validation:**
```typescript
// lib/security/validation.ts
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Zod schemas for API validation
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .refine((email) => {
      // Additional email validation
      return validator.isEmail(email, {
        allow_utf8_local_part: false,
        require_tld: true
      });
    }, 'Invalid email format'),
    
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .refine((password) => {
      // Strong password requirements
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
    }, 'Password must contain uppercase, lowercase, number, and special character'),
    
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .refine((name) => {
      // Only allow letters, spaces, and common punctuation
      return /^[a-zA-Z\s'-\.]+$/.test(name);
    }, 'Name contains invalid characters')
});

export const websiteUrlSchema = z.object({
  url: z
    .string()
    .url('Invalid URL format')
    .refine((url) => {
      // Additional URL validation
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol) &&
             !validator.isIP(parsed.hostname) || // Allow domains, not direct IPs
             validator.isFQDN(parsed.hostname);
    }, 'Invalid website URL')
});

// HTML sanitization
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  });
};

// SQL injection prevention
export const sanitizeSqlInput = (input: string): string => {
  // Use parameterized queries with Prisma, but additional sanitization
  return input
    .replace(/['"\\;]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .trim();
};

// File upload validation
export const validateFileUpload = (file: Express.Multer.File) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }
  
  if (file.size > maxFileSize) {
    throw new Error('File too large');
  }
  
  // Validate file header matches extension
  const fileType = require('file-type');
  const detectedType = fileType.fromBuffer(file.buffer);
  
  if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
    throw new Error('File type mismatch');
  }
  
  return true;
};
```

### 3. API Security

**API Security Middleware:**
```typescript
// lib/security/api-security.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Helmet security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for development
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// CORS configuration
export const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://zenith-platform.com',
      'https://www.zenith-platform.com',
      'https://app.zenith-platform.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Authorization',
    'Accept'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
});

// API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    retryAfter: 15 * 60
  },
  
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health',
  
  // Custom rate limits for different endpoints
  keyGenerator: (req) => {
    if (req.path.startsWith('/api/auth/')) {
      return `auth-${req.ip}`;
    }
    return req.ip;
  }
});

// API key authentication
export const apiKeyAuth = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key format
  if (!/^zp_[a-zA-Z0-9]{32}$/.test(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }
  
  // Verify API key (implement your validation logic)
  const isValid = validateApiKey(apiKey);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Request logging for security monitoring
export const securityLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      apiKey: req.headers['x-api-key'] ? 'present' : 'absent'
    };
    
    // Log suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Security Alert:', logData);
    }
    
    // Log to security monitoring system
    sendToSecurityMonitoring(logData);
  });
  
  next();
};
```

## 🔒 Infrastructure Security

### 1. Network Security

**Firewall Configuration:**
```bash
#!/bin/bash
# /scripts/security/firewall-setup.sh

set -e

# UFW (Uncomplicated Firewall) configuration
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# SSH access (restrict to specific IPs)
ufw allow from 203.0.113.0/24 to any port 22 comment 'SSH from office'
ufw allow from 198.51.100.0/24 to any port 22 comment 'SSH from VPN'

# HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Database access (only from application servers)
ufw allow from 10.0.1.0/24 to any port 5432 comment 'PostgreSQL from app servers'

# Redis access (only from application servers)
ufw allow from 10.0.1.0/24 to any port 6379 comment 'Redis from app servers'

# Monitoring and logging
ufw allow from 10.0.2.0/24 to any port 9100 comment 'Node exporter'

# Block common attack vectors
ufw deny from 0.0.0.0/8
ufw deny from 127.0.0.0/8
ufw deny from 169.254.0.0/16
ufw deny from 224.0.0.0/4
ufw deny from 240.0.0.0/5

# Enable logging
ufw logging on

# Enable firewall
ufw enable

echo "Firewall configuration completed"
```

**Fail2ban Configuration:**
```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600

[recidive]
enabled = true
filter = recidive
logpath = /var/log/fail2ban.log
action = iptables-allports[name=recidive]
         sendmail-whois-lines[name=recidive, logpath=/var/log/fail2ban.log]
bantime = 86400
findtime = 86400
maxretry = 5
```

### 2. SSL/TLS Configuration

**Nginx SSL Configuration:**
```nginx
# /etc/nginx/sites-available/zenith-platform-ssl
server {
    listen 443 ssl http2;
    server_name zenith-platform.com www.zenith-platform.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/zenith-platform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zenith-platform.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/zenith-platform.com/chain.pem;

    # SSL security configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'none';" always;

    # Hide server information
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers for proxied requests
        proxy_set_header X-Content-Type-Options nosniff;
        proxy_set_header X-Frame-Options DENY;
    }

    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name zenith-platform.com www.zenith-platform.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Database Security

**PostgreSQL Security Configuration:**
```sql
-- /scripts/security/postgres-security.sql

-- Create application user with limited privileges
CREATE USER zenith_app WITH PASSWORD 'strong_random_password';

-- Grant minimal necessary permissions
GRANT CONNECT ON DATABASE zenith_platform TO zenith_app;
GRANT USAGE ON SCHEMA public TO zenith_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO zenith_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO zenith_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zenith_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO zenith_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON pg_settings FROM PUBLIC;
REVOKE ALL ON pg_stat_statements FROM PUBLIC;

-- Create read-only user for reporting
CREATE USER zenith_readonly WITH PASSWORD 'another_strong_password';
GRANT CONNECT ON DATABASE zenith_platform TO zenith_readonly;
GRANT USAGE ON SCHEMA public TO zenith_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO zenith_readonly;
```

**PostgreSQL Configuration (postgresql.conf):**
```ini
# Connection settings
listen_addresses = 'localhost,10.0.1.0/24'
port = 5432
max_connections = 100

# SSL settings
ssl = on
ssl_cert_file = '/etc/ssl/certs/postgres.crt'
ssl_key_file = '/etc/ssl/private/postgres.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'
ssl_prefer_server_ciphers = on
ssl_ciphers = 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256'

# Authentication
password_encryption = scram-sha-256

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_connections = on
log_disconnections = on
log_statement = 'ddl'
log_min_duration_statement = 1000

# Security
shared_preload_libraries = 'pg_stat_statements'
track_functions = all
```

## 🔍 Security Monitoring and Intrusion Detection

### 1. Security Information and Event Management (SIEM)

**Security Event Monitoring:**
```typescript
// lib/security/siem.ts
export class SecurityEventMonitor {
  private redis = redis;
  private alertThresholds = {
    failedLogins: 5,
    suspiciousIPs: 10,
    unauthorizedAccess: 3,
    dataExfiltration: 1
  };

  async logSecurityEvent(event: SecurityEvent) {
    const eventData = {
      ...event,
      timestamp: Date.now(),
      severity: this.calculateSeverity(event),
      source: 'zenith-platform'
    };

    // Store in Redis for real-time analysis
    await this.redis.lpush('security:events', JSON.stringify(eventData));
    await this.redis.expire('security:events', 86400); // 24 hours

    // Store in long-term storage
    await this.storeInElasticsearch(eventData);

    // Check for alert conditions
    await this.checkAlertConditions(eventData);
  }

  private async checkAlertConditions(event: SecurityEvent) {
    switch (event.type) {
      case 'failed_login':
        await this.checkFailedLogins(event.ip, event.userAgent);
        break;
      case 'unauthorized_access':
        await this.checkUnauthorizedAccess(event.userId, event.resource);
        break;
      case 'data_access':
        await this.checkDataAccess(event.userId, event.dataType);
        break;
    }
  }

  private async checkFailedLogins(ip: string, userAgent: string) {
    const key = `failed_logins:${ip}`;
    const count = await this.redis.incr(key);
    await this.redis.expire(key, 3600); // 1 hour window

    if (count >= this.alertThresholds.failedLogins) {
      await this.triggerAlert('HIGH', 'Multiple failed login attempts', {
        ip,
        userAgent,
        attempts: count
      });

      // Auto-block IP
      await this.blockIP(ip, 'Multiple failed login attempts');
    }
  }

  private async triggerAlert(severity: string, message: string, context: any) {
    const alert = {
      severity,
      message,
      context,
      timestamp: Date.now(),
      resolved: false
    };

    // Send to alerting systems
    await this.sendToSlack(alert);
    await this.sendToEmail(alert);
    
    if (severity === 'CRITICAL') {
      await this.sendToPagerDuty(alert);
    }
  }

  private async blockIP(ip: string, reason: string) {
    // Add to firewall block list
    await this.redis.sadd('blocked_ips', ip);
    await this.redis.setex(`block_reason:${ip}`, 86400, reason);

    // Update firewall rules
    await this.updateFirewallRules();
  }
}

interface SecurityEvent {
  type: 'failed_login' | 'unauthorized_access' | 'data_access' | 'suspicious_activity';
  ip: string;
  userAgent?: string;
  userId?: string;
  resource?: string;
  dataType?: string;
  description: string;
  metadata?: any;
}
```

### 2. Intrusion Detection System

**File Integrity Monitoring:**
```bash
#!/bin/bash
# /scripts/security/file-integrity-monitor.sh

set -e

# AIDE (Advanced Intrusion Detection Environment) setup
aide_config="/etc/aide/aide.conf"

# Initialize AIDE database
if [ ! -f "/var/lib/aide/aide.db" ]; then
    echo "Initializing AIDE database..."
    aide --init
    mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
fi

# Configure AIDE monitoring rules
cat > "$aide_config" << EOF
# AIDE configuration for Zenith Platform

# Define what to monitor
/bin Binlib
/sbin Binlib
/usr/bin Binlib
/usr/sbin Binlib
/usr/local/bin Binlib
/etc Config
/opt/zenith-platform StaticDir
/var/log/nginx LogFiles
/var/log/postgresql LogFiles

# Rules
Binlib = p+i+n+u+g+s+b+m+c+md5+sha1
Config = p+i+n+u+g+s+b+m+c+md5+sha1
StaticDir = p+i+n+u+g+s+m+c+md5+sha1
LogFiles = p+u+g+i+n+S

# Exclude temporary files
!/tmp
!/var/tmp
!/proc
!/sys
!/dev
EOF

# Run AIDE check
aide_check() {
    echo "Running AIDE integrity check..."
    if aide --check; then
        echo "No file integrity violations detected"
    else
        echo "File integrity violations detected!"
        aide --check > /var/log/aide-violations.log
        
        # Send alert
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data '{"text":"🚨 File integrity violations detected on production server"}'
    fi
}

# Schedule daily checks
cat > /etc/cron.daily/aide-check << 'EOF'
#!/bin/bash
/scripts/security/file-integrity-monitor.sh aide_check
EOF

chmod +x /etc/cron.daily/aide-check

# Run function if called
if [ "$1" = "aide_check" ]; then
    aide_check
fi
```

### 3. Web Application Firewall (WAF)

**Cloudflare WAF Rules:**
```json
{
  "waf_rules": [
    {
      "id": "sql_injection_prevention",
      "expression": "(http.request.uri.query contains \"union\" and http.request.uri.query contains \"select\") or (http.request.body contains \"union\" and http.request.body contains \"select\")",
      "action": "block",
      "description": "Block SQL injection attempts"
    },
    {
      "id": "xss_prevention",
      "expression": "http.request.uri.query contains \"<script\" or http.request.body contains \"<script\"",
      "action": "block",
      "description": "Block XSS attempts"
    },
    {
      "id": "rate_limit_api",
      "expression": "http.request.uri.path matches \"^/api/\"",
      "action": "rate_limit",
      "rate_limit": {
        "threshold": 100,
        "period": 60,
        "action": "block"
      },
      "description": "Rate limit API endpoints"
    },
    {
      "id": "geographic_blocking",
      "expression": "ip.geoip.country in {\"CN\" \"RU\" \"KP\"}",
      "action": "challenge",
      "description": "Challenge requests from high-risk countries"
    },
    {
      "id": "bot_protection",
      "expression": "cf.bot_management.score lt 30",
      "action": "managed_challenge",
      "description": "Challenge low-scoring bot traffic"
    }
  ]
}
```

## 🔐 Data Protection and Privacy

### 1. Data Encryption

**Data Encryption Implementation:**
```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

export class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;

  constructor(private masterKey: string) {
    if (!masterKey || masterKey.length < 32) {
      throw new Error('Master key must be at least 32 characters');
    }
  }

  encrypt(data: string | object): string {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(this.ivLength);
    const key = crypto.scryptSync(this.masterKey, 'salt', this.keyLength);
    
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV, tag, and encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = crypto.scryptSync(this.masterKey, 'salt', this.keyLength);
    
    const decipher = crypto.createDecipher(this.algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Field-level encryption for sensitive data
  encryptField(value: string, fieldName: string): string {
    const fieldKey = crypto.createHash('sha256').update(this.masterKey + fieldName).digest('hex');
    const encryption = new DataEncryption(fieldKey);
    return encryption.encrypt(value);
  }

  decryptField(encryptedValue: string, fieldName: string): string {
    const fieldKey = crypto.createHash('sha256').update(this.masterKey + fieldName).digest('hex');
    const encryption = new DataEncryption(fieldKey);
    return encryption.decrypt(encryptedValue);
  }
}

// Database encryption for sensitive fields
export const encryptSensitiveData = {
  beforeSave: (user: any) => {
    const encryption = new DataEncryption(process.env.ENCRYPTION_KEY!);
    
    if (user.email) {
      user.emailEncrypted = encryption.encryptField(user.email, 'email');
    }
    
    if (user.phone) {
      user.phoneEncrypted = encryption.encryptField(user.phone, 'phone');
    }
    
    return user;
  },
  
  afterLoad: (user: any) => {
    const encryption = new DataEncryption(process.env.ENCRYPTION_KEY!);
    
    if (user.emailEncrypted) {
      user.email = encryption.decryptField(user.emailEncrypted, 'email');
    }
    
    if (user.phoneEncrypted) {
      user.phone = encryption.decryptField(user.phoneEncrypted, 'phone');
    }
    
    return user;
  }
};

// Environment variables
ENCRYPTION_KEY=your-32-character-encryption-key
FIELD_ENCRYPTION_ENABLED=true
```

### 2. GDPR Compliance

**Data Privacy Implementation:**
```typescript
// lib/security/gdpr.ts
export class GDPRCompliance {
  // Data retention policies
  private retentionPolicies = {
    userAccounts: 2555, // 7 years in days
    auditLogs: 2555,
    analyticsData: 1095, // 3 years
    backups: 365 // 1 year
  };

  async handleDataSubjectRequest(userId: string, requestType: 'access' | 'delete' | 'portability') {
    switch (requestType) {
      case 'access':
        return await this.generateDataExport(userId);
      case 'delete':
        return await this.deleteUserData(userId);
      case 'portability':
        return await this.generatePortableData(userId);
      default:
        throw new Error('Invalid request type');
    }
  }

  private async generateDataExport(userId: string) {
    const userData = await this.collectUserData(userId);
    const exportData = {
      personal_information: userData.profile,
      account_information: userData.account,
      usage_data: userData.analytics,
      preferences: userData.preferences,
      export_date: new Date().toISOString(),
      retention_period: this.retentionPolicies.userAccounts + ' days'
    };

    return {
      format: 'JSON',
      data: exportData,
      size: JSON.stringify(exportData).length
    };
  }

  private async deleteUserData(userId: string) {
    // Soft delete to maintain referential integrity
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        name: 'Deleted User',
        deletedAt: new Date(),
        gdprDeletedAt: new Date()
      }
    });

    // Hard delete personal data
    await this.anonymizeUserData(userId);

    // Log deletion for compliance
    await this.logGDPRAction(userId, 'data_deleted');

    return { success: true, deletedAt: new Date().toISOString() };
  }

  private async anonymizeUserData(userId: string) {
    // Anonymize data while preserving analytics integrity
    const anonymousId = crypto.randomUUID();
    
    await prisma.analytics.updateMany({
      where: { userId },
      data: { userId: anonymousId }
    });

    await prisma.auditLog.updateMany({
      where: { userId },
      data: { 
        userId: anonymousId,
        details: 'User data anonymized for GDPR compliance'
      }
    });
  }

  async checkDataRetention() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.userAccounts);

    // Find users past retention period
    const usersToDelete = await prisma.user.findMany({
      where: {
        deletedAt: {
          lt: cutoffDate
        },
        gdprDeletedAt: null
      }
    });

    for (const user of usersToDelete) {
      await this.deleteUserData(user.id);
    }

    return { deletedUsers: usersToDelete.length };
  }

  private async logGDPRAction(userId: string, action: string) {
    await prisma.gdprLog.create({
      data: {
        userId,
        action,
        timestamp: new Date(),
        ipAddress: 'system',
        userAgent: 'automated-gdpr-compliance'
      }
    });
  }
}

// Cookie consent management
export const cookieConsent = {
  essential: ['session', 'security', 'authentication'],
  analytics: ['google-analytics', 'hotjar'],
  marketing: ['facebook-pixel', 'google-ads'],
  
  getConsentStatus: (req: any) => {
    const consent = req.cookies.cookie_consent;
    return consent ? JSON.parse(consent) : null;
  },
  
  setConsentCookie: (res: any, consent: any) => {
    res.cookie('cookie_consent', JSON.stringify(consent), {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });
  }
};
```

## 🚨 Incident Response and Security Operations

### 1. Security Incident Response Plan

**Incident Response Procedures:**
```typescript
// lib/security/incident-response.ts
export class IncidentResponse {
  private severityLevels = {
    P1: { name: 'Critical', responseTime: 15, escalationTime: 30 },
    P2: { name: 'High', responseTime: 60, escalationTime: 120 },
    P3: { name: 'Medium', responseTime: 240, escalationTime: 480 },
    P4: { name: 'Low', responseTime: 1440, escalationTime: 2880 }
  };

  async handleSecurityIncident(incident: SecurityIncident) {
    // Log incident
    await this.logIncident(incident);

    // Determine severity
    const severity = this.calculateSeverity(incident);

    // Immediate response actions
    await this.executeImmediateResponse(incident, severity);

    // Notify response team
    await this.notifyResponseTeam(incident, severity);

    // Start investigation
    await this.initiateInvestigation(incident);

    return {
      incidentId: incident.id,
      severity,
      responseTime: this.severityLevels[severity].responseTime
    };
  }

  private async executeImmediateResponse(incident: SecurityIncident, severity: string) {
    switch (incident.type) {
      case 'data_breach':
        await this.isolateAffectedSystems();
        await this.preserveEvidence();
        break;
      
      case 'unauthorized_access':
        await this.revokeUserSessions(incident.affectedUsers);
        await this.blockSuspiciousIPs(incident.suspiciousIPs);
        break;
      
      case 'malware_detected':
        await this.quarantineAffectedSystems();
        await this.runMalwareScan();
        break;
      
      case 'ddos_attack':
        await this.activateDDoSProtection();
        await this.adjustRateLimits();
        break;
    }
  }

  private async isolateAffectedSystems() {
    // Implement system isolation logic
    console.log('Isolating affected systems...');
  }

  private async preserveEvidence() {
    // Create forensic copies of logs and data
    const timestamp = Date.now();
    await this.createLogSnapshot(`evidence_${timestamp}`);
  }

  private async notifyResponseTeam(incident: SecurityIncident, severity: string) {
    const notifications = [
      this.sendSlackAlert(incident, severity),
      this.sendEmailAlert(incident, severity)
    ];

    if (severity === 'P1' || severity === 'P2') {
      notifications.push(this.sendPagerDutyAlert(incident, severity));
    }

    await Promise.all(notifications);
  }
}

interface SecurityIncident {
  id: string;
  type: 'data_breach' | 'unauthorized_access' | 'malware_detected' | 'ddos_attack';
  description: string;
  affectedUsers?: string[];
  suspiciousIPs?: string[];
  detectedAt: Date;
  reportedBy: string;
  evidence: any[];
}
```

### 2. Security Automation and Orchestration

**Security Automation Scripts:**
```bash
#!/bin/bash
# /scripts/security/automated-response.sh

set -e

INCIDENT_TYPE="$1"
SEVERITY="$2"
AFFECTED_IP="$3"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SECURITY: $1" | tee -a /var/log/security-incidents.log
}

case "$INCIDENT_TYPE" in
    "brute_force")
        log "Handling brute force attack from $AFFECTED_IP"
        
        # Block IP immediately
        ufw insert 1 deny from "$AFFECTED_IP"
        
        # Add to fail2ban permanently
        fail2ban-client set sshd banip "$AFFECTED_IP"
        
        # Alert security team
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Brute force attack detected and blocked: $AFFECTED_IP\"}"
        ;;
        
    "sql_injection")
        log "Handling SQL injection attempt from $AFFECTED_IP"
        
        # Block IP
        ufw insert 1 deny from "$AFFECTED_IP"
        
        # Capture full request logs
        grep "$AFFECTED_IP" /var/log/nginx/access.log > "/tmp/sql_injection_${AFFECTED_IP}_$(date +%s).log"
        
        # Alert with high priority
        curl -X POST "$PAGERDUTY_API" \
            -H 'Content-Type: application/json' \
            --data "{\"incident_key\":\"sql_injection_$AFFECTED_IP\",\"event_type\":\"trigger\",\"description\":\"SQL injection attempt from $AFFECTED_IP\"}"
        ;;
        
    "malware_upload")
        log "Handling malware upload attempt"
        
        # Quarantine uploaded files
        mkdir -p /quarantine
        mv /tmp/uploads/* /quarantine/ 2>/dev/null || true
        
        # Run virus scan
        clamscan -r /quarantine --move=/quarantine/infected
        
        # Alert security team
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data '{"text":"🦠 Malware upload detected and quarantined"}'
        ;;
        
    *)
        log "Unknown incident type: $INCIDENT_TYPE"
        exit 1
        ;;
esac

log "Automated response completed for $INCIDENT_TYPE"
```

## 📋 Security Checklist

### Pre-Production Security Checklist

#### Application Security
- [ ] **Authentication & Authorization**
  - [ ] Strong password policies implemented
  - [ ] Multi-factor authentication enabled
  - [ ] Session management secure
  - [ ] Role-based access control configured
  - [ ] JWT tokens properly secured

- [ ] **Input Validation & Sanitization**
  - [ ] All user inputs validated
  - [ ] SQL injection protection implemented
  - [ ] XSS protection configured
  - [ ] File upload restrictions in place
  - [ ] CSRF protection enabled

- [ ] **API Security**
  - [ ] Rate limiting implemented
  - [ ] API key authentication configured
  - [ ] CORS policies properly set
  - [ ] Security headers implemented
  - [ ] Request/response logging enabled

#### Infrastructure Security
- [ ] **Network Security**
  - [ ] Firewall rules configured
  - [ ] DDoS protection enabled
  - [ ] VPN access for admin functions
  - [ ] Network segmentation implemented
  - [ ] Intrusion detection system active

- [ ] **Server Security**
  - [ ] OS security updates applied
  - [ ] Unnecessary services disabled
  - [ ] SSH keys properly managed
  - [ ] File integrity monitoring enabled
  - [ ] Fail2ban configured

- [ ] **Database Security**
  - [ ] Database user permissions restricted
  - [ ] SSL/TLS encryption enabled
  - [ ] Backup encryption configured
  - [ ] Audit logging enabled
  - [ ] Connection limits set

#### Data Protection
- [ ] **Encryption**
  - [ ] Data at rest encrypted
  - [ ] Data in transit encrypted
  - [ ] Encryption key management configured
  - [ ] Field-level encryption for sensitive data
  - [ ] Backup encryption enabled

- [ ] **Privacy Compliance**
  - [ ] GDPR compliance implemented
  - [ ] Cookie consent management configured
  - [ ] Data retention policies defined
  - [ ] Data subject request handling implemented
  - [ ] Privacy policy updated

### Production Security Monitoring

#### Real-time Monitoring
- [ ] **Security Event Monitoring**
  - [ ] Failed login attempts tracked
  - [ ] Suspicious IP addresses monitored
  - [ ] Unauthorized access attempts logged
  - [ ] Data access patterns analyzed
  - [ ] File integrity violations detected

- [ ] **Automated Response**
  - [ ] IP blocking automation configured
  - [ ] Incident response procedures automated
  - [ ] Alert escalation configured
  - [ ] Evidence preservation automated
  - [ ] Communication templates ready

#### Regular Security Activities
- [ ] **Weekly Tasks**
  - [ ] Security log review
  - [ ] Vulnerability scan execution
  - [ ] Backup integrity verification
  - [ ] Security metrics analysis
  - [ ] Incident response drill

- [ ] **Monthly Tasks**
  - [ ] Penetration testing
  - [ ] Security configuration review
  - [ ] Access control audit
  - [ ] Disaster recovery testing
  - [ ] Security awareness training

- [ ] **Quarterly Tasks**
  - [ ] Comprehensive security audit
  - [ ] Risk assessment update
  - [ ] Security policy review
  - [ ] Vendor security assessment
  - [ ] Compliance certification renewal

## 📞 Security Emergency Contacts

### Security Response Team
- **Security Lead**: +1-555-0201 (security@zenith-platform.com)
- **Incident Commander**: +1-555-0202 (incidents@zenith-platform.com)
- **Legal Counsel**: +1-555-0203 (legal@zenith-platform.com)
- **Public Relations**: +1-555-0204 (pr@zenith-platform.com)

### External Security Services
- **Penetration Testing**: security-vendor@example.com
- **Forensics Consultant**: forensics@example.com
- **Legal Compliance**: compliance@example.com
- **Cyber Insurance**: insurance@example.com

### Regulatory Contacts
- **Data Protection Authority**: +1-800-DPA-REPORT
- **FBI Cyber Division**: +1-855-292-3937
- **CISA**: +1-888-282-0870

---

**Last Updated**: 2025-06-25  
**Version**: 1.0  
**Classification**: Internal Use Only  
**Reviewed By**: Security Team, Compliance Team, Legal Team