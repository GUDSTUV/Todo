import express from "express";
import { signup, login, googleOneTap, me } from "../controllers/authController";
import { validateSignup, validateLogin } from "../middleware/validation";
import passport from "passport";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/auth";
import { JWT_SECRET } from "../config/jwt";

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", validateSignup, signup);

// POST /api/auth/login
router.post("/login", validateLogin, login);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user as any;
    console.log("[OAuth callback] Creating JWT for user:", user.email);
    console.log(
      "[OAuth callback] Using JWT_SECRET:",
      JWT_SECRET.substring(0, 10) + "...",
    );

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    console.log(
      "[OAuth callback] Token created, preview:",
      token.substring(0, 30) + "...",
    );
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    console.log(
      "[OAuth callback] Redirecting to:",
      `${clientUrl}/dashboard?token=...`,
    );
    res.redirect(`${clientUrl}/dashboard?token=${token}`);
  },
);

// Google Identity Services (One Tap) endpoint
router.post("/google/verify", googleOneTap);

// Get current authenticated user
router.get("/me", protect, me);
export default router;
