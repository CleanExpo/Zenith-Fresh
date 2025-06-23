import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const startTime = Date.now();
    let responseData: any = {
      url: targetUrl.href,
      status: 'Unknown',
      responseTime: 0,
      ssl: false,
      error: null
    };

    try {
      // Perform the health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(targetUrl.href, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Zenith-Health-Checker/1.0'
        }
      });

      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      responseData.responseTime = endTime - startTime;
      responseData.ssl = targetUrl.protocol === 'https:';

      if (response.ok) {
        responseData.status = `${response.status} ${response.statusText}`;
      } else {
        responseData.status = `${response.status} ${response.statusText}`;
      }

      // Additional checks
      const headers = {
        'content-type': response.headers.get('content-type'),
        'server': response.headers.get('server'),
        'cache-control': response.headers.get('cache-control'),
        'x-powered-by': response.headers.get('x-powered-by')
      };

      responseData.headers = headers;

      // Performance rating
      if (responseData.responseTime < 200) {
        responseData.performance = 'Excellent';
      } else if (responseData.responseTime < 500) {
        responseData.performance = 'Good';
      } else if (responseData.responseTime < 1000) {
        responseData.performance = 'Fair';
      } else {
        responseData.performance = 'Poor';
      }

      // Security score
      let securityScore = 0;
      if (responseData.ssl) securityScore += 40;
      if (headers['cache-control']) securityScore += 20;
      if (!headers['x-powered-by']) securityScore += 20; // Better if not exposed
      if (headers.server && !headers.server.includes('Apache') && !headers.server.includes('nginx')) securityScore += 20;
      
      responseData.securityScore = securityScore;

    } catch (error: any) {
      const endTime = Date.now();
      responseData.responseTime = endTime - startTime;
      
      if (error.name === 'AbortError') {
        responseData.error = 'Request timeout (10s limit)';
      } else if (error.code === 'ENOTFOUND') {
        responseData.error = 'Domain not found';
      } else if (error.code === 'ECONNREFUSED') {
        responseData.error = 'Connection refused';
      } else {
        responseData.error = error.message || 'Connection failed';
      }
      responseData.status = 'Unreachable';
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}