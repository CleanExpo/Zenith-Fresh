import type { NextRequest } from "next/server"
import { prisma } from "./prisma"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (request: NextRequest) => string
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async isAllowed(request: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(request) : this.getDefaultKey(request)
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.config.windowMs)

    // Clean up old entries
    await prisma.rateLimitEntry.deleteMany({
      where: {
        createdAt: { lt: windowStart },
      },
    })

    // Count current requests in window
    const currentCount = await prisma.rateLimitEntry.count({
      where: {
        key,
        createdAt: { gte: windowStart },
      },
    })

    const allowed = currentCount < this.config.maxRequests
    const remaining = Math.max(0, this.config.maxRequests - currentCount - 1)
    const resetTime = new Date(now.getTime() + this.config.windowMs)

    if (allowed) {
      // Record this request
      await prisma.rateLimitEntry.create({
        data: { key },
      })
    }

    return { allowed, remaining, resetTime }
  }

  private getDefaultKey(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown"
    return `ip:${ip}`
  }
}

// Predefined rate limiters
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
})

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
})

export const analysisRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyGenerator: (request) => {
    const authHeader = request.headers.get("authorization")
    if (authHeader) {
      // Rate limit by user if authenticated
      try {
        const token = authHeader.substring(7)
        const payload = JSON.parse(atob(token.split(".")[1]))
        return `user:${payload.userId}`
      } catch {
        // Fall back to IP if token is invalid
      }
    }
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown"
    return `ip:${ip}`
  },
})
