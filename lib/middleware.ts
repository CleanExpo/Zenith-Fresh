import { type NextRequest, NextResponse } from "next/server";
import { AuthService } from "./auth";
import type { RateLimiter } from "./rate-limit";
import { authRateLimit, apiRateLimit, analysisRateLimit } from "./rate-limit";

export function withAuth(
  handler: (
    request: NextRequest,
    context: { user: any }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const token = AuthService.extractTokenFromRequest(request);

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      const user = await AuthService.getUserFromToken(token);

      if (!user) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      return handler(request, { user });
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}

export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const { allowed, remaining, resetTime } = await rateLimiter.isAllowed(
        request
      );

      if (!allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": resetTime.toISOString(),
              "Retry-After": Math.ceil(
                (resetTime.getTime() - Date.now()) / 1000
              ).toString(),
            },
          }
        );
      }

      const response = await handler(request);

      // Add rate limit headers to successful responses
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", resetTime.toISOString());

      return response;
    } catch (error) {
      console.error("Rate limit middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await handler(request);

    // Add CORS headers to all responses
    response.headers.set(
      "Access-Control-Allow-Origin",
      process.env.ALLOWED_ORIGINS || "*"
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return response;
  };
}
