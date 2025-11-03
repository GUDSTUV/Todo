// Extend Express Request type to include user from JWT
import { Request as ExpressRequest } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
    // Override the User interface to avoid conflicts with passport
    interface User {
      userId: string;
      email: string;
    }
  }
}

// Also export types for direct import
export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser;
}

export {};
