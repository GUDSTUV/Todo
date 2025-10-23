import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

interface JwtPayload {
  userId: string;
  email: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ 
        success: false,
        error: 'Not authorized to access this route' 
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      // Attach user info to request
      (req as any).user = decoded;
      
      next();
    } catch (error) {
      res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token' 
      });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during authentication' 
    });
  }
};

// Optional: Admin role check (for future use)
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    
    if (!roles.includes(userRole)) {
      res.status(403).json({ 
        success: false,
        error: 'You do not have permission to perform this action' 
      });
      return;
    }
    
    next();
  };
};
