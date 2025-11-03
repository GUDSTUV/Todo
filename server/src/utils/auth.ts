/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";

/**
 * Helper function to get authenticated user ID from request
 * Returns userId if authenticated, otherwise sends 401 response
 */
export function getAuthenticatedUserId(
  req: Request,
  res: Response
): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return null;
  }
  return userId;
}

/**
 * Type guard to check if user is authenticated
 */
export function isAuthenticated(
  req: Request
): req is Request & { user: { userId: string; email: string } } {
  return !!req.user?.userId;
}
