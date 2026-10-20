import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  resetTime: number;
}

const attempts = new Map<string, AttemptRecord>();

// Clean up old records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetTime) {
      attempts.delete(key);
    }
  }
}, 60000);

export function authRateLimiter(maxAttempts = 15, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `auth_${ip}`;
    const now = Date.now();

    const record = attempts.get(key);

    if (!record || now > record.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxAttempts) {
      res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please wait a minute and try again.',
      });
      return;
    }

    record.count++;
    next();
  };
}
