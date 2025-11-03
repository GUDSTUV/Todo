"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="./types/express" />
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const listRoutes_1 = __importDefault(require("./routes/listRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const inviteRoutes_1 = __importDefault(require("./routes/inviteRoutes"));
const passport_1 = __importDefault(require("./config/passport"));
const express_session_1 = __importDefault(require("express-session"));
const notifications_1 = require("./scheduler/notifications");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security Middleware
// Configure Helmet to allow cross-origin image loads from the client (5173)
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
})); // Set security HTTP headers
// CORS: allow configured client URL and common Vite dev ports
const defaultClient = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([
    defaultClient,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true); // allow server-to-server and curl
        if (allowedOrigins.has(origin))
            return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});
const isProd = process.env.NODE_ENV === "production";
const authLimiter = (0, express_rate_limit_1.default)({
    // In production: 15 minutes window, strict cap
    // In development: 1 minute window, very high cap to avoid blocking manual tests
    windowMs: isProd ? 15 * 60 * 1000 : 60 * 1000,
    max: isProd ? 5 : 1000,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // Only count requests that result in 4xx/5xx
    message: "Too many authentication attempts, please try again later.",
});
app.use("/api/", limiter);
app.use("/api/auth", authLimiter);
// Body parser middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Serve static files from uploads directory (ensure cross-origin resource policy allows it)
app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Session and auth must be registered BEFORE routes so passport works on route handlers
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Routes
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Todu API" });
});
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// API routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/tasks", taskRoutes_1.default);
app.use("/api/lists", listRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
app.use("/api/invites", inviteRoutes_1.default);
app.use("/api", commentRoutes_1.default);
app.use("/api/activities", activityRoutes_1.default);
// Error handler middleware
app.use((err, req, res, _next) => {
    console.error("Server error:", err);
    res.status(500).json({
        success: false,
        error: "Something went wrong!",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
// Start server
const startServer = async () => {
    try {
        // Connect to database
        await (0, db_1.connectDB)();
        // Initialize background schedulers (cron jobs)
        (0, notifications_1.initNotificationScheduler)();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
