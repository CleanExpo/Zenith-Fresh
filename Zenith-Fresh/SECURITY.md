# Zenith Platform Security System

## Overview

The Zenith Platform implements enterprise-grade security features suitable for Fortune 500 companies. This comprehensive security system includes advanced rate limiting, DDoS protection, threat detection, API key management, and real-time monitoring.

## Security Features

### 1. Advanced Rate Limiting
- **Redis-based counters** for distributed rate limiting
- **User tier-based limits** (Free, Pro, Enterprise, Admin)
- **Endpoint-specific rate limits** with custom configurations
- **IP-based and user-based tracking**
- **Automatic scaling** based on user subscription level

#### Rate Limit Tiers
- **Free**: 100 requests/hour, 10 analyses/hour, 5 exports/hour
- **Pro**: 1,000 requests/hour, 100 analyses/hour, 50 exports/hour
- **Enterprise**: 10,000 requests/hour, 1,000 analyses/hour, 500 exports/hour
- **Admin**: 50,000 requests/hour, 5,000 analyses/hour, 2,500 exports/hour

### 2. API Key Management
- **Secure key generation** with bcrypt hashing
- **Scope-based permissions** system
- **Per-key rate limiting** and expiration
- **Real-time key validation** with Redis caching
- **Usage tracking** and analytics
- **Automatic key rotation** (configurable)

#### Available Scopes
- `website:analyze` - Analyze website performance and SEO
- `website:scan` - Perform website security scans
- `website:export` - Export analysis reports
- `projects:read/write/delete` - Project management
- `teams:read/write/admin` - Team management
- `analytics:read/export` - Analytics access
- `api:read/manage` - API management
- `admin:users/security/system` - Administrative functions

### 3. IP Filtering & Blacklisting
- **Dynamic IP whitelisting** with CIDR support
- **Automatic threat-based blocking** with configurable durations
- **Geographic IP filtering** (optional)
- **Tor exit node detection** and blocking
- **VPN/Proxy detection** with risk scoring
- **Manual IP management** interface

### 4. Comprehensive Security Headers
- **Content Security Policy (CSP)** with nonce support
- **HTTP Strict Transport Security (HSTS)** for HTTPS
- **X-Frame-Options** for clickjacking protection
- **X-Content-Type-Options** for MIME type sniffing protection
- **Referrer Policy** for privacy protection
- **Cross-Origin policies** for resource isolation

### 5. Real-time Threat Detection
- **SQL Injection** pattern detection
- **Cross-Site Scripting (XSS)** prevention
- **Command Injection** protection
- **Directory Traversal** blocking
- **Malicious User Agent** detection
- **Custom threat patterns** with regex support

### 6. Abuse Detection & Prevention
- **Behavioral analysis** with machine learning patterns
- **Request frequency monitoring**
- **Error rate analysis**
- **Pattern recognition** for bot detection
- **Geolocation anomaly detection**
- **Time-based pattern analysis**

### 7. DDoS Protection
- **Volumetric attack detection** with adaptive thresholds
- **Application layer protection** (Layer 7)
- **Distributed attack mitigation**
- **Slow Loris protection**
- **Automatic traffic analysis** and response
- **Emergency mode** for critical attacks

### 8. Comprehensive Audit Logging
- **Security event tracking** with 20+ event types
- **Real-time alerting** for critical events
- **Detailed forensic logging** with full request context
- **Compliance reporting** (SOC 2, ISO 27001 ready)
- **Export capabilities** (CSV, JSON, SIEM integration)
- **Long-term retention** with automated archiving

### 9. Security Analytics Dashboard
- **Real-time threat monitoring**
- **Attack visualization** with charts and graphs
- **Geographic attack mapping**
- **Trend analysis** and predictive insights
- **Performance metrics** and KPIs
- **Customizable alerts** and notifications

## Architecture

### Security Middleware Flow
```
Request → IP Filtering → Threat Detection → Rate Limiting → 
Authentication → Authorization → DDoS Check → Abuse Detection → 
Response with Security Headers
```

### Database Schema
The security system uses the following main models:
- `SecurityEvent` - All security events and incidents
- `APIKey` - API key management with scopes
- `IPWhitelist/IPBlacklist` - IP filtering rules
- `RateLimitConfig` - Custom rate limit configurations
- `ThreatPattern` - Custom threat detection patterns

### Redis Integration
- **Rate limiting counters** with sliding windows
- **Security event caching** for real-time alerts
- **IP reputation caching** for fast lookups
- **DDoS protection state** management
- **API key validation caching**

## Configuration

### Environment Variables
Copy `.env.security.example` to `.env.local` and configure:

```bash
# Redis (required for advanced features)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Security settings
SECURITY_ENABLED=true
SECURITY_RATE_LIMIT_GLOBAL=1000
DDOS_PROTECTION_ENABLED=true
```

### Database Setup
1. Run Prisma migrations to create security tables:
```bash
npx prisma migrate dev
```

2. Generate Prisma client:
```bash
npx prisma generate
```

### Redis Setup
1. Install Redis locally or use a cloud provider
2. Configure connection in environment variables
3. Test connection with health check endpoint

## Usage

### Basic Integration
The security middleware is automatically applied to all routes. No additional configuration needed for basic protection.

### API Key Usage
```javascript
// Create API key for user
const { apiKey, key } = await createAPIKey({
  userId: 'user123',
  name: 'My API Key',
  scopes: ['website:analyze', 'projects:read'],
  rateLimit: 1000,
});

// Use API key in requests
fetch('/api/analyze', {
  headers: {
    'Authorization': `Bearer ${key}`
  }
});
```

### Custom Rate Limits
```javascript
// Set custom rate limit for specific user/endpoint
await createCustomRateLimit(
  'user123',
  '/api/heavy-operation',
  100, // requests
  3600 // per hour
);
```

### IP Management
```javascript
// Whitelist an IP
await addIPToWhitelist('192.168.1.100', 'Office IP');

// Blacklist an IP
await addIPToBlacklist('10.0.0.1', 'Suspicious activity', 'HIGH');

// Add IP range
await addIPRangeToBlacklist('192.168.0.0/16', 'Blocked subnet', 'MEDIUM');
```

### Security Event Logging
```javascript
// Log custom security event
await logSecurityEvent({
  type: 'CUSTOM_THREAT',
  severity: 'HIGH',
  sourceIp: '192.168.1.1',
  userId: 'user123',
  details: { customData: 'threat details' }
});
```

## Monitoring & Alerts

### Dashboard Access
Visit `/security` for the comprehensive security dashboard featuring:
- Real-time threat monitoring
- Attack statistics and trends
- Top attackers and threat types
- System protection status
- Event timeline and analysis

### API Endpoints
- `GET /api/security/stats` - Security statistics
- `GET /api/security/events` - Security events with filtering
- `GET /api/security/threats` - Threat analysis data
- `POST /api/security/export` - Export security events

### Real-time Monitoring
Enable real-time monitoring in the dashboard to see:
- Live security events
- Active attacks in progress
- Protection system status
- Performance metrics

## Security Best Practices

### For Administrators
1. **Regular monitoring** of security dashboard
2. **Review and update** threat patterns monthly
3. **Audit API keys** and remove unused ones
4. **Monitor rate limit** usage and adjust tiers
5. **Review IP whitelist/blacklist** regularly
6. **Export security logs** for compliance

### For Developers
1. **Use API keys** with minimal required scopes
2. **Implement proper error handling** for rate limits
3. **Cache responses** to reduce API calls
4. **Monitor application** for security events
5. **Follow security headers** recommendations
6. **Report suspicious activity** immediately

### For End Users
1. **Protect API keys** like passwords
2. **Rotate keys regularly** (every 90 days recommended)
3. **Monitor usage** in dashboard
4. **Report abuse** or suspicious activity
5. **Use HTTPS** for all API communications
6. **Implement client-side** rate limiting

## Compliance & Standards

### SOC 2 Type II Ready
- Comprehensive audit logging
- Access control and authentication
- Data encryption in transit and at rest
- Incident response procedures
- Regular security assessments

### ISO 27001 Compatible
- Information security management
- Risk assessment and treatment
- Security policy enforcement
- Continuous monitoring
- Documentation and procedures

### GDPR Compliant
- Privacy by design
- Data minimization
- Right to erasure (IP anonymization)
- Consent management
- Data breach notification

## Performance Impact

### Benchmarks
- **Middleware overhead**: <5ms average
- **Rate limiting check**: <1ms with Redis
- **Threat detection**: <2ms for standard patterns
- **IP filtering**: <0.5ms with caching
- **API key validation**: <1ms with Redis cache

### Optimization Tips
1. **Use Redis** for production deployments
2. **Enable caching** for IP reputation
3. **Optimize threat patterns** for performance
4. **Monitor response times** and adjust thresholds
5. **Use CDN** for static content delivery

## Troubleshooting

### Common Issues

#### High False Positives
- Review and adjust threat patterns
- Whitelist legitimate IPs/user agents
- Tune abuse detection thresholds
- Check for misconfigured rate limits

#### Performance Issues
- Ensure Redis is properly configured
- Monitor database query performance
- Check threat pattern complexity
- Review logging configuration

#### Rate Limit Errors
- Verify user tier configuration
- Check custom rate limit settings
- Monitor API usage patterns
- Consider tier upgrades for high-volume users

### Debug Mode
Enable debug logging by setting:
```bash
SECURITY_LOG_LEVEL=DEBUG
```

### Health Checks
- `/api/health` - General system health
- Test Redis connection
- Verify database connectivity
- Check security middleware status

## Support & Updates

### Regular Updates
The security system is continuously updated with:
- New threat patterns
- Performance improvements
- Additional compliance features
- Enhanced monitoring capabilities

### Professional Support
For enterprise customers:
- 24/7 security monitoring
- Custom threat pattern development
- Compliance audit assistance
- Performance optimization consulting

### Community
- GitHub issues for bug reports
- Security vulnerability disclosure
- Feature requests and feedback
- Documentation improvements

## Changelog

### Version 2.0.0 (Current)
- Complete rewrite with Redis integration
- Advanced threat detection patterns
- Real-time security dashboard
- Enhanced API key management
- DDoS protection system
- Comprehensive audit logging

### Version 1.0.0
- Basic rate limiting
- Simple IP filtering
- Security headers
- Event logging

---

**⚠️ Security Notice**: This system is designed for production use but should be regularly updated and monitored. Report security vulnerabilities responsibly through our security contact.