import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole } from '../models/User.js';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action.`,
      });
      return;
    }

    next();
  };
}
