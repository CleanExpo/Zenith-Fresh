import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const trackApiUsage = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Store the original end function
  const originalEnd = res.end;

  // Override the end function
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;

    // Track the API call
    if (req.user) {
      prisma.analytics.create({
        data: {
          type: 'api_call',
          action: `${req.method} ${req.path}`,
          metadata: JSON.stringify({
            duration,
            statusCode: res.statusCode,
            userAgent: req.headers['user-agent'],
            ip: req.ip
          }),
          userId: req.user.id
        }
      }).catch(console.error);
    }

    // Call the original end function
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};
