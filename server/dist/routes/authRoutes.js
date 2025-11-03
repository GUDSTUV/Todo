"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const jwt_1 = require("../config/jwt");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// POST /api/auth/signup
router.post("/signup", validation_1.validateSignup, authController_1.signup);
// POST /api/auth/login
router.post("/login", validation_1.validateLogin, authController_1.login);
// POST /api/auth/forgot-password
router.post("/forgot-password", authController_1.forgotPassword);
// PUT /api/auth/reset-password/:resetToken
router.put("/reset-password/:resetToken", authController_1.resetPassword);
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/" }), (req, res) => {
    const user = req.user;
    const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, jwt_1.JWT_SECRET, {
        expiresIn: "7d",
    });
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/dashboard?token=${token}`);
});
// Google Identity Services (One Tap) endpoint
router.post("/google/verify", authController_1.googleOneTap);
// Get current authenticated user
router.get("/me", auth_1.protect, authController_1.me);
// Change password (while logged in)
router.put("/change-password", auth_1.protect, authController_1.changePassword);
// Update profile
router.patch("/profile", auth_1.protect, authController_1.updateProfile);
// Upload avatar
router.post("/avatar", auth_1.protect, upload_1.upload.single("avatar"), authController_1.uploadAvatar);
// Delete account
router.delete("/account", auth_1.protect, authController_1.deleteAccount);
router.post("/forgot-password", authController_1.forgotPassword);
router.post("/reset-password/:token", authController_1.resetPassword);
exports.default = router;
