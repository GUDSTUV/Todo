import express from "express";
import {
  signup,
  login,
  googleOneTap,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  uploadAvatar,
  deleteAccount,
} from "../controllers/authController";
import { validateSignup, validateLogin } from "../middleware/validation";
import passport from "passport";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/auth";
import { JWT_SECRET } from "../config/jwt";
import { upload } from "../middleware/upload";

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", validateSignup, signup);

// POST /api/auth/login
router.post("/login", validateLogin, login);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// PUT /api/auth/reset-password/:resetToken
router.put("/reset-password/:resetToken", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user as any;

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/dashboard?token=${token}`);
  }
);

// Google Identity Services (One Tap) endpoint
router.post("/google/verify", googleOneTap);

// Get current authenticated user
router.get("/me", protect, me);

// Change password (while logged in)
router.put("/change-password", protect, changePassword);

// Update profile
router.patch("/profile", protect, updateProfile);

// Upload avatar
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

// Delete account
router.delete("/account", protect, deleteAccount);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
export default router;
