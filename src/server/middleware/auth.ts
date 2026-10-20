import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { dataStore } from '../data/dataStore.js';
import { config } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    userId: string;
    name: string;
    email: string;
    role: 'HR' | 'MANAGER' | 'EMPLOYEE';
    employeeId?: string;
    isActive: boolean;
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies[config.cookieName]) {
      token = req.cookies[config.cookieName];
    }

    // 2. Fallback to Bearer token in Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource.',
      });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
      return;
    }

    // Fetch user from data store to verify active state and current role
    const user = await dataStore.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your HR administrator.',
      });
      return;
    }

    req.user = {
      _id: String(user._id),
      userId: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      isActive: user.isActive,
    };

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication verification failure.',
      error: err.message,
    });
  }
}
