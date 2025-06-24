#!/usr/bin/env node

/**
 * Health Check Script for Docker Container
 * Tests application health and critical endpoints
 */

const http = require('http');

const healthCheck = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const healthData = JSON.parse(data);
          if (res.statusCode === 200 && healthData.status === 'healthy') {
            console.log('✅ Health check passed');
            resolve(true);
          } else {
            console.log('❌ Health check failed:', healthData);
            reject(new Error('Health check failed'));
          }
        } catch (error) {
          console.log('❌ Health check parse error:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Health check request error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('❌ Health check timeout');
      req.destroy();
      reject(new Error('Health check timeout'));
    });

    req.end();
  });
};

// Run health check
healthCheck()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));