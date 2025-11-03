"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const protect = async (req, res, next) => {
    try {
        let token;
        // Check for token in Authorization header
        if (req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                error: "Not authorized to access this route",
            });
            return;
        }
        try {
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Attach user info to request
            req.user = decoded;
            next();
        }
        catch (jwtError) {
            console.error("[auth middleware] JWT verification failed:", jwtError);
            res.status(401).json({
                success: false,
                error: "Invalid or expired token",
            });
            return;
        }
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({
            success: false,
            error: "Server error during authentication",
        });
    }
};
exports.protect = protect;
// Optional: Admin role check (for future use)
const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!roles.includes(userRole)) {
            res.status(403).json({
                success: false,
                error: "You do not have permission to perform this action",
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
