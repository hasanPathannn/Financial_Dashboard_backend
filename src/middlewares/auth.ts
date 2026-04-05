import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/db';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; status: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Access denied. No token provided.' }); return; }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; status: string };
    if (decoded.status === 'INACTIVE') {
      res.status(403).json({ error: 'Account is inactive.' }); return;
    }
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      return;
    }
    next();
  };
};