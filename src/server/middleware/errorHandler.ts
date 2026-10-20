import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[API Error]:', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
}
