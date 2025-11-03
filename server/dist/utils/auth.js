"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUserId = getAuthenticatedUserId;
exports.isAuthenticated = isAuthenticated;
/**
 * Helper function to get authenticated user ID from request
 * Returns userId if authenticated, otherwise sends 401 response
 */
function getAuthenticatedUserId(req, res) {
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
function isAuthenticated(req) {
    return !!req.user?.userId;
}
