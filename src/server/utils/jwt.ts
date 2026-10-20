import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserRole } from '../models/User.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as any);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (err) {
    return null;
  }
}
