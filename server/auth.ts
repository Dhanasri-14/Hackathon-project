import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { queryOne } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'uyirthunai-secure-secret-key-2026-prod';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
  city?: string;
  locality?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    // Verify user still exists in database
    const dbUser = queryOne('SELECT id, email, full_name, role, phone, city, locality FROM users WHERE id = ?', [decoded.id]);
    if (!dbUser) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }
    req.user = dbUser;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
    return;
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access Denied: Your role (${req.user.role}) is not authorized for this action. Allowed: ${allowedRoles.join(', ')}`,
      });
      return;
    }
    next();
  };
}
