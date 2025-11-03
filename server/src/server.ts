/// <reference types="./types/express" />
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import listRoutes from "./routes/listRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import commentRoutes from "./routes/commentRoutes";
import activityRoutes from "./routes/activityRoutes";
import messageRoutes from "./routes/messageRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import passport from "./config/passport";
import session from "express-session";
import { initNotificationScheduler } from "./scheduler/notifications";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
// Configure Helmet to allow cross-origin image loads from the client (5173)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
); // Set security HTTP headers
// CORS: allow configured client URL and common Vite dev ports
const defaultClient = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([
  defaultClient,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
]);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server and curl
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

const isProd = process.env.NODE_ENV === "production";
const authLimiter = rateLimit({
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from uploads directory (ensure cross-origin resource policy allows it)
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

// Session and auth must be registered BEFORE routes so passport works on route handlers
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Todu API" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api", commentRoutes);
app.use("/api/activities", activityRoutes);
// Error handler middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
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
    await connectDB();

    // Initialize background schedulers (cron jobs)
    initNotificationScheduler();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
