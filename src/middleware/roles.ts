import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Check if user is admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Check if user has required role
export const hasRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
};

// Check if user has project access
export const hasProjectAccess = (requiredRole?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.projectId;

      const member = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      if (!member) {
        return res.status(403).json({ error: 'Project access denied' });
      }

      if (requiredRole && member.role !== requiredRole) {
        return res.status(403).json({ error: 'Insufficient project permissions' });
      }

      // Add member info to request for use in route handlers
      req.projectMember = member;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
};

// Extend Express Request type to include projectMember
declare global {
  namespace Express {
    interface Request {
      projectMember?: any;
    }
  }
} 