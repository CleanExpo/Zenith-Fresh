import { randomBytes } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Generate a secure random token for invitations
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate JWT token
 */
export function generateJWT(payload: any, expiresIn: SignOptions['expiresIn'] = '7d'): string {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET is not defined');
  }
  
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET, options);
}

/**
 * Verify JWT token
 */
export function verifyJWT(token: string): any {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET is not defined');
  }
  
  return jwt.verify(token, process.env.NEXTAUTH_SECRET);
}

/**
 * Generate invitation token with embedded data
 */
export function generateInvitationToken(teamId: string, email: string): string {
  const payload = {
    teamId,
    email,
    type: 'invitation',
    timestamp: Date.now()
  };
  
  return generateJWT(payload, '7d');
} 