# SSL Certificate Configuration Guide

## Overview

This guide provides comprehensive instructions for configuring SSL/TLS certificates for the Zenith Platform production deployment, including certificate procurement, installation, automation, and security best practices.

## 🔐 SSL/TLS Security Strategy

### Certificate Architecture
```
┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Root CA        │───▶│ Intermediate CA │───▶│ End Certificate  │
│ (Certificate     │    │ (Certificate    │    │ (your-domain.com)│
│  Authority)      │    │  Authority)     │    │                  │
└──────────────────┘    └─────────────────┘    └──────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌──────────────────┐
         │                       │              │ Wildcard Cert    │
         │                       │              │ (*.your-domain)  │
         │                       │              └──────────────────┘
         │                       ▼                       │
         │              ┌─────────────────┐              ▼
         │              │ OCSP Responder  │    ┌──────────────────┐
         │              │ (Revocation)    │    │ SAN Certificate  │
         │              └─────────────────┘    │ (Multi-domain)   │
         ▼                                     └──────────────────┘
┌──────────────────┐
│ Certificate      │
│ Transparency Log │
└──────────────────┘
```

### Certificate Types for Zenith Platform
- **Domain Validated (DV)**: Basic domain ownership validation
- **Organization Validated (OV)**: Business identity verification
- **Extended Validation (EV)**: Highest level of authentication
- **Wildcard Certificates**: Secure all subdomains
- **Multi-Domain (SAN)**: Multiple domains in one certificate

## 🏆 Certificate Authorities

### 1. Let's Encrypt (Recommended for Development/Staging)

**Advantages:**
- Free certificates
- Automated renewal
- 90-day validity (forces good practices)
- Widely trusted
- API-driven

**Setup with Certbot:**
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Automatic renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Environment Configuration:**
```bash
# Let's Encrypt certificate paths
SSL_CERT_PATH="/etc/letsencrypt/live/your-domain.com/fullchain.pem"
SSL_KEY_PATH="/etc/letsencrypt/live/your-domain.com/privkey.pem"
SSL_CHAIN_PATH="/etc/letsencrypt/live/your-domain.com/chain.pem"
```

### 2. Commercial Certificate Authorities (Production)

**Recommended Providers:**
- **DigiCert**: Enterprise-grade, excellent support
- **GlobalSign**: Strong reputation, good for SaaS
- **Sectigo (Comodo)**: Cost-effective, reliable
- **GoDaddy**: Popular, moderate pricing

**DigiCert Certificate Setup:**
```bash
# Generate Certificate Signing Request (CSR)
openssl req -new -newkey rsa:2048 -nodes -keyout your-domain.com.key -out your-domain.com.csr

# CSR Information
Country Name: US
State: California
City: San Francisco
Organization: Your Company Name
Organizational Unit: IT Department
Common Name: your-domain.com
Email Address: admin@your-domain.com
```

**Certificate Installation:**
```bash
# Install certificate files
sudo cp your-domain.com.crt /etc/ssl/certs/
sudo cp your-domain.com.key /etc/ssl/private/
sudo cp intermediate.crt /etc/ssl/certs/
sudo cp root.crt /etc/ssl/certs/

# Set proper permissions
sudo chmod 644 /etc/ssl/certs/your-domain.com.crt
sudo chmod 600 /etc/ssl/private/your-domain.com.key
sudo chown root:root /etc/ssl/certs/your-domain.com.crt
sudo chown root:root /etc/ssl/private/your-domain.com.key
```

## 🌐 Platform-Specific SSL Configuration

### 1. Vercel SSL Configuration

**Automatic SSL (Recommended):**
```json
// vercel.json
{
  "version": 2,
  "build": {
    "env": {
      "NEXT_PUBLIC_VERCEL_URL": "@vercel-url"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "x-forwarded-proto",
          "value": "http"
        }
      ],
      "destination": "https://your-domain.com/$1",
      "permanent": true
    }
  ]
}
```

**Custom Domain SSL:**
```bash
# Add custom domain to Vercel
vercel domains add your-domain.com

# Verify domain ownership
vercel domains verify your-domain.com

# Check SSL certificate status
vercel domains ls
```

### 2. Railway SSL Configuration

**Automatic SSL:**
```yaml
# railway.toml
[build]
  builder = "nixpacks"

[deploy]
  healthcheckPath = "/api/health"
  restartPolicyType = "ON_FAILURE"

# Custom domain with SSL
domains = ["your-domain.com", "www.your-domain.com"]
```

**Environment Variables:**
```bash
# Railway SSL configuration
RAILWAY_STATIC_URL=https://your-domain.com
RAILWAY_PUBLIC_DOMAIN=your-domain.com
```

### 3. AWS CloudFront SSL Configuration

**CloudFront Distribution:**
```json
{
  "ViewerCertificate": {
    "AcmCertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
    "SslSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021",
    "CertificateSource": "acm"
  },
  "ViewerProtocolPolicy": "redirect-to-https",
  "Aliases": [
    "your-domain.com",
    "www.your-domain.com"
  ]
}
```

**AWS Certificate Manager (ACM):**
```bash
# Request certificate
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names www.your-domain.com api.your-domain.com \
  --validation-method DNS \
  --region us-east-1

# Describe certificate
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
```

## 🔧 Next.js SSL Configuration

### 1. Production SSL Headers

```typescript
// next.config.js
const nextConfig = {
  // Force HTTPS in production
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://your-domain.com/$1',
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HSTS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content type sniffing protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Clickjacking protection
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none';",
          },
        ],
      },
    ];
  },

  // PoweredBy header removal
  poweredByHeader: false,

  // Compression
  compress: true,

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.NODE_ENV === 'production' ? 'prod-value' : 'dev-value',
  },
};

module.exports = nextConfig;
```

### 2. SSL Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Add security headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 🔍 SSL Certificate Monitoring

### 1. Certificate Expiration Monitoring

```typescript
// lib/ssl-monitor.ts
import https from 'https';
import { URL } from 'url';

export class SSLMonitor {
  async checkCertificate(hostname: string): Promise<{
    valid: boolean;
    daysUntilExpiry: number;
    issuer: string;
    subject: string;
    serialNumber: string;
  }> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        port: 443,
        method: 'GET',
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        const cert = res.connection.getPeerCertificate();
        
        if (res.connection.authorized) {
          const now = new Date();
          const expiry = new Date(cert.valid_to);
          const daysUntilExpiry = Math.floor(
            (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          resolve({
            valid: true,
            daysUntilExpiry,
            issuer: cert.issuer.O || 'Unknown',
            subject: cert.subject.CN || 'Unknown',
            serialNumber: cert.serialNumber,
          });
        } else {
          resolve({
            valid: false,
            daysUntilExpiry: 0,
            issuer: 'Invalid',
            subject: 'Invalid',
            serialNumber: 'Invalid',
          });
        }
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  async monitorDomains(domains: string[]): Promise<void> {
    for (const domain of domains) {
      try {
        const result = await this.checkCertificate(domain);
        
        console.log(`SSL Certificate Status for ${domain}:`);
        console.log(`  Valid: ${result.valid}`);
        console.log(`  Days until expiry: ${result.daysUntilExpiry}`);
        console.log(`  Issuer: ${result.issuer}`);
        console.log(`  Subject: ${result.subject}`);

        // Alert if certificate expires within 30 days
        if (result.daysUntilExpiry <= 30) {
          await this.sendExpiryAlert(domain, result.daysUntilExpiry);
        }
      } catch (error) {
        console.error(`Error checking SSL for ${domain}:`, error);
        await this.sendErrorAlert(domain, error.message);
      }
    }
  }

  private async sendExpiryAlert(domain: string, days: number): Promise<void> {
    // Implement your alerting logic here
    console.warn(`SSL ALERT: Certificate for ${domain} expires in ${days} days`);
  }

  private async sendErrorAlert(domain: string, error: string): Promise<void> {
    console.error(`SSL ERROR: ${domain} - ${error}`);
  }
}

// Usage
const sslMonitor = new SSLMonitor();

// Check certificates daily
setInterval(async () => {
  await sslMonitor.monitorDomains([
    'your-domain.com',
    'www.your-domain.com',
    'api.your-domain.com',
  ]);
}, 24 * 60 * 60 * 1000); // 24 hours
```

### 2. SSL Health Check API

```typescript
// app/api/ssl-health/route.ts
import { NextResponse } from 'next/server';
import { SSLMonitor } from '@/lib/ssl-monitor';

const sslMonitor = new SSLMonitor();

export async function GET() {
  try {
    const domains = [
      'your-domain.com',
      'www.your-domain.com',
      'api.your-domain.com',
    ];

    const results = await Promise.all(
      domains.map(async (domain) => {
        try {
          const cert = await sslMonitor.checkCertificate(domain);
          return { domain, ...cert, error: null };
        } catch (error) {
          return {
            domain,
            valid: false,
            daysUntilExpiry: 0,
            issuer: 'Error',
            subject: 'Error',
            serialNumber: 'Error',
            error: error.message,
          };
        }
      })
    );

    const overallHealth = results.every(r => r.valid && r.daysUntilExpiry > 7);

    return NextResponse.json({
      healthy: overallHealth,
      certificates: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'SSL health check failed', details: error.message },
      { status: 500 }
    );
  }
}
```

## 🔄 Certificate Automation

### 1. Automated Renewal Script

```bash
#!/bin/bash
# ssl-renewal.sh

set -e

DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"
WEBROOT="/var/www/html"

# Check if certificate needs renewal (30 days before expiry)
if openssl x509 -checkend 2592000 -noout -in "/etc/letsencrypt/live/$DOMAIN/cert.pem"; then
    echo "Certificate is still valid for more than 30 days"
    exit 0
fi

echo "Certificate needs renewal"

# Stop services that might interfere
sudo systemctl stop nginx

# Renew certificate
certbot renew --force-renewal --email "$EMAIL" --agree-tos

# Restart services
sudo systemctl start nginx

# Test SSL configuration
if curl -fsS "https://$DOMAIN" > /dev/null; then
    echo "SSL renewal successful and site is accessible"
    
    # Send success notification
    curl -X POST "https://hooks.slack.com/your-webhook-url" \
        -H 'Content-type: application/json' \
        --data '{"text":"✅ SSL certificate renewed successfully for '$DOMAIN'"}'
else
    echo "SSL renewal failed - site not accessible"
    
    # Send failure notification
    curl -X POST "https://hooks.slack.com/your-webhook-url" \
        -H 'Content-type: application/json' \
        --data '{"text":"❌ SSL certificate renewal failed for '$DOMAIN'"}'
    
    exit 1
fi
```

### 2. GitHub Actions SSL Monitoring

```yaml
# .github/workflows/ssl-monitoring.yml
name: SSL Certificate Monitoring

on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM UTC
  workflow_dispatch:

jobs:
  ssl-check:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Check SSL certificates
      run: |
        domains=("your-domain.com" "www.your-domain.com" "api.your-domain.com")
        
        for domain in "${domains[@]}"; do
          echo "Checking SSL certificate for $domain"
          
          # Get certificate expiry date
          expiry_date=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
          
          # Convert to seconds since epoch
          expiry_epoch=$(date -d "$expiry_date" +%s)
          current_epoch=$(date +%s)
          
          # Calculate days until expiry
          days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
          
          echo "Days until expiry for $domain: $days_until_expiry"
          
          # Alert if certificate expires within 30 days
          if [ $days_until_expiry -le 30 ]; then
            echo "::warning::SSL certificate for $domain expires in $days_until_expiry days"
          fi
          
          # Fail if certificate expires within 7 days
          if [ $days_until_expiry -le 7 ]; then
            echo "::error::SSL certificate for $domain expires in $days_until_expiry days"
            exit 1
          fi
        done
    
    - name: Notify on Slack
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: 'SSL certificate monitoring failed'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🛡️ SSL Security Best Practices

### 1. TLS Configuration

```nginx
# nginx.conf SSL configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/your-domain.com.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.com.key;
    ssl_trusted_certificate /etc/ssl/certs/intermediate.crt;

    # SSL security settings
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

    # Your application configuration
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
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. SSL Testing and Validation

```bash
#!/bin/bash
# ssl-test.sh

DOMAIN="your-domain.com"

echo "Testing SSL configuration for $DOMAIN"

# Test SSL Labs rating
echo "SSL Labs rating (this may take a few minutes):"
curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&publish=off&all=done" | jq -r '.endpoints[0].grade'

# Test certificate chain
echo "Testing certificate chain:"
openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -text | grep -A1 "Issuer:"

# Test HSTS header
echo "Testing HSTS header:"
curl -sI https://$DOMAIN | grep -i strict-transport-security

# Test security headers
echo "Testing security headers:"
curl -sI https://$DOMAIN | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"

# Test TLS version support
echo "Testing TLS versions:"
for version in tls1 tls1_1 tls1_2 tls1_3; do
    if openssl s_client -connect $DOMAIN:443 -$version < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo "$version: Supported"
    else
        echo "$version: Not supported"
    fi
done

# Test cipher suites
echo "Testing cipher suites:"
nmap --script ssl-enum-ciphers -p 443 $DOMAIN
```

## 📋 SSL Deployment Checklist

### Pre-Deployment
- [ ] Choose appropriate certificate type (DV/OV/EV)
- [ ] Generate CSR with correct information
- [ ] Purchase/obtain certificate from CA
- [ ] Verify certificate chain completeness
- [ ] Test certificate installation locally
- [ ] Configure automatic renewal
- [ ] Set up monitoring and alerting
- [ ] Plan backup certificates

### Deployment
- [ ] Install certificate on production servers
- [ ] Configure web server SSL settings
- [ ] Enable HTTPS redirects
- [ ] Set up HSTS headers
- [ ] Configure OCSP stapling
- [ ] Test SSL configuration
- [ ] Verify security headers
- [ ] Run SSL Labs test
- [ ] Update DNS CAA records
- [ ] Monitor certificate deployment

### Post-Deployment
- [ ] Verify all pages load over HTTPS
- [ ] Check mixed content warnings
- [ ] Test certificate on multiple browsers
- [ ] Verify mobile compatibility
- [ ] Monitor SSL expiry dates
- [ ] Set up renewal reminders
- [ ] Document certificate details
- [ ] Update security documentation

## 📞 Support Resources

### SSL Testing Tools
- **SSL Labs**: [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
- **SSL Checker**: [sslchecker.com](https://www.sslchecker.com/)
- **DigiCert SSL Inspector**: [digicert.com/help](https://www.digicert.com/help/)

### Certificate Authorities
- **Let's Encrypt**: [letsencrypt.org](https://letsencrypt.org/)
- **DigiCert**: [digicert.com](https://www.digicert.com/)
- **GlobalSign**: [globalsign.com](https://www.globalsign.com/)
- **Sectigo**: [sectigo.com](https://sectigo.com/)

### Documentation
- **Mozilla SSL Config**: [ssl-config.mozilla.org](https://ssl-config.mozilla.org/)
- **OWASP TLS Cheat Sheet**: [owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

---

**Last Updated**: 2025-06-25  
**Version**: 1.0  
**Reviewed By**: Security Team, DevOps Team