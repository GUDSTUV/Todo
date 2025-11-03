"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.uploadAvatar = exports.updateProfile = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.me = exports.googleOneTap = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const List_1 = __importDefault(require("../models/List"));
const google_auth_library_1 = require("google-auth-library");
const sendEmail_1 = require("../utils/sendEmail");
const crypto_1 = __importDefault(require("crypto"));
const upload_1 = require("../middleware/upload");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validate input
        if (!name || !email || !password) {
            res
                .status(400)
                .json({ error: "Please provide name, email, and password" });
            return;
        }
        if (password.length < 6) {
            res
                .status(400)
                .json({ error: "Password must be at least 6 characters long" });
            return;
        }
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ error: "User with this email already exists" });
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Create user
        const user = await User_1.default.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
        });
        // Create default lists for new user
        await List_1.default.create([
            {
                userId: user._id,
                name: "Inbox",
                description: "Default inbox for all unorganized tasks",
                isDefault: true,
                icon: "inbox",
                color: "#3B82F6",
                order: 0,
            },
            {
                userId: user._id,
                name: "Today",
                description: "Tasks to complete today",
                isDefault: true,
                icon: "calendar",
                color: "#10B981",
                order: 1,
            },
            {
                userId: user._id,
                name: "Upcoming",
                description: "Tasks scheduled for the future",
                isDefault: true,
                icon: "clock",
                color: "#F59E0B",
                order: 2,
            },
        ]);
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Return user data and token
        res.status(201).json({
            message: "Account created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    }
    catch (error) {
        console.error("Signup error:", error);
        res
            .status(500)
            .json({ error: "Failed to create account. Please try again." });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            res.status(400).json({ error: "Please provide email and password" });
            return;
        }
        // Find user
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // If user registered via Google (no password), block password login
        if (!user.passwordHash) {
            res.status(400).json({
                error: "This account uses Google Sign-In. Please log in with Google.",
            });
            return;
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Return user data and token
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to log in. Please try again." });
    }
};
exports.login = login;
const googleOneTap = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            res.status(400).json({ error: "Missing Google credential" });
            return;
        }
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            res
                .status(500)
                .json({ error: "Server is not configured for Google OAuth" });
            return;
        }
        const client = new google_auth_library_1.OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            res.status(401).json({ error: "Invalid Google credential" });
            return;
        }
        const googleId = payload.sub;
        const email = (payload.email || "").toLowerCase();
        const name = payload.name || email || "Google User";
        const avatarUrl = payload.picture || undefined;
        // Try to find by googleId or existing account by email
        let user = await User_1.default.findOne({ $or: [{ googleId }, { email }] });
        let isNewUser = false;
        if (!user) {
            user = await User_1.default.create({ googleId, email, name, avatarUrl });
            isNewUser = true;
        }
        else if (!user.googleId) {
            user.googleId = googleId;
            if (!user.avatarUrl && avatarUrl)
                user.avatarUrl = avatarUrl;
            await user.save();
        }
        // Create default lists for new Google OAuth users
        if (isNewUser) {
            await List_1.default.create([
                {
                    userId: user._id,
                    name: "Inbox",
                    description: "Default inbox for all unorganized tasks",
                    isDefault: true,
                    icon: "inbox",
                    color: "#3B82F6",
                    order: 0,
                },
                {
                    userId: user._id,
                    name: "Today",
                    description: "Tasks to complete today",
                    isDefault: true,
                    icon: "calendar",
                    color: "#10B981",
                    order: 1,
                },
                {
                    userId: user._id,
                    name: "Upcoming",
                    description: "Tasks scheduled for the future",
                    isDefault: true,
                    icon: "clock",
                    color: "#F59E0B",
                    order: 2,
                },
            ]);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    }
    catch (error) {
        console.error("Google One Tap auth error:", error);
        res.status(500).json({ error: "Failed to authenticate with Google" });
    }
};
exports.googleOneTap = googleOneTap;
const me = async (req, res) => {
    try {
        const decoded = req.user || {};
        const userId = decoded.userId || decoded.id;
        const email = decoded.email;
        let user = null;
        if (userId) {
            user = await User_1.default.findById(userId);
        }
        else if (email) {
            user = await User_1.default.findOne({ email: email.toLowerCase() });
        }
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    }
    catch (error) {
        console.error("Fetch current user error:", error);
        res.status(500).json({ error: "Failed to fetch current user" });
    }
};
exports.me = me;
// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Validate input
        if (!email) {
            res.status(400).json({ error: "Please provide your email address" });
            return;
        }
        // Find user
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        // Always return success message (security best practice)
        // Don't reveal whether the email exists or not
        const successMessage = "If an account exists with this email, a password reset link has been sent.";
        if (!user) {
            res.status(200).json({ message: successMessage });
            return;
        }
        // Don't allow password reset for Google OAuth users
        if (user.googleId && !user.passwordHash) {
            res.status(200).json({ message: successMessage });
            return;
        }
        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        // Create reset URL
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
        try {
            // Send email
            await (0, sendEmail_1.sendPasswordResetEmail)(user.email, resetUrl);
            res.status(200).json({
                message: successMessage,
            });
        }
        catch (emailError) {
            console.error("Email sending error:", emailError);
            // Reset token fields if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({
                error: "Failed to send password reset email. Please try again later.",
            });
        }
    }
    catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            error: "Failed to process request. Please try again.",
        });
    }
};
exports.forgotPassword = forgotPassword;
// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { password } = req.body;
        // Validate input
        if (!password) {
            res.status(400).json({ error: "Please provide a new password" });
            return;
        }
        if (password.length < 6) {
            res
                .status(400)
                .json({ error: "Password must be at least 6 characters long" });
            return;
        }
        // Hash the token from URL to match stored hash
        const resetPasswordToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        // Find user with valid reset token
        const user = await User_1.default.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) {
            res.status(400).json({
                error: "Invalid or expired reset token. Please request a new one.",
            });
            return;
        }
        // Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        // Generate new JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            message: "Password reset successful. You are now logged in.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            error: "Failed to reset password. Please try again.",
        });
    }
};
exports.resetPassword = resetPassword;
// @desc    Change password (while logged in)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                error: "Please provide both current and new password",
            });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({
                error: "New password must be at least 6 characters long",
            });
            return;
        }
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Check if user has a password (not OAuth-only account)
        if (!user.passwordHash) {
            res.status(400).json({
                error: "Cannot change password for OAuth-only accounts",
            });
            return;
        }
        // Verify current password
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Current password is incorrect" });
            return;
        }
        // Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await user.save();
        res.status(200).json({
            message: "Password changed successfully",
        });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            error: "Failed to change password. Please try again.",
        });
    }
};
exports.changePassword = changePassword;
// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, email, preferences, avatarUrl } = req.body;
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Update fields if provided
        if (name)
            user.name = name;
        // Update avatar URL (for URL-based avatars)
        if (avatarUrl !== undefined) {
            // If user has an uploaded avatar, delete it before setting URL
            if (user.avatarUrl && !user.avatarUrl.startsWith("http")) {
                (0, upload_1.deleteOldAvatar)(user.avatarUrl);
            }
            user.avatarUrl = avatarUrl || undefined; // Allow removal by sending empty string
        }
        // Check if email is being changed and if it's already taken
        if (email && email.toLowerCase() !== user.email) {
            const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                res.status(409).json({ error: "Email already in use" });
                return;
            }
            user.email = email.toLowerCase();
        }
        // Update preferences
        if (preferences) {
            if (preferences.theme)
                user.preferences.theme = preferences.theme;
            if (preferences.timezone)
                user.preferences.timezone = preferences.timezone;
            if (preferences.language)
                user.preferences.language = preferences.language;
        }
        await user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                preferences: user.preferences,
            },
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            error: "Failed to update profile. Please try again.",
        });
    }
};
exports.updateProfile = updateProfile;
// @desc    Upload avatar image
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Check if file was uploaded
        if (!req.file) {
            res.status(400).json({ error: "Please upload an image file" });
            return;
        }
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Delete old avatar if it's an uploaded file (not a URL)
        if (user.avatarUrl && !user.avatarUrl.startsWith("http")) {
            (0, upload_1.deleteOldAvatar)(user.avatarUrl);
        }
        // Save new avatar path
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        user.avatarUrl = avatarUrl;
        await user.save();
        res.status(200).json({
            message: "Avatar uploaded successfully",
            avatarUrl,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        console.error("Upload avatar error:", error);
        res.status(500).json({
            error: "Failed to upload avatar. Please try again.",
        });
    }
};
exports.uploadAvatar = uploadAvatar;
// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { password, confirmDelete } = req.body;
        // Require explicit confirmation
        if (confirmDelete !== "DELETE MY ACCOUNT") {
            res.status(400).json({
                error: 'Please type "DELETE MY ACCOUNT" to confirm',
            });
            return;
        }
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Verify password for accounts with passwords
        if (user.passwordHash) {
            if (!password) {
                res.status(400).json({
                    error: "Please provide your password to confirm account deletion",
                });
                return;
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                res.status(401).json({ error: "Incorrect password" });
                return;
            }
        }
        // Import Task model here to avoid circular dependency
        const Task = (await Promise.resolve().then(() => __importStar(require("../models/Task")))).default;
        // Delete all user's tasks and lists (cascade delete)
        await Task.deleteMany({ userId });
        await List_1.default.deleteMany({ userId });
        // Delete user
        await user.deleteOne();
        res.status(200).json({
            message: "Account deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({
            error: "Failed to delete account. Please try again.",
        });
    }
};
exports.deleteAccount = deleteAccount;
