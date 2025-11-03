"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOldAvatar = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Create uploads directory if it doesn't exist
const uploadDir = path_1.default.join(__dirname, "../../uploads/avatars");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure multer storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: userId-timestamp.extension
        const userId = req.user?.userId || req.user?._id || "anon";
        const ext = path_1.default.extname(file.originalname);
        const filename = `${userId}-${Date.now()}${ext}`;
        cb(null, filename);
    },
});
// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed!"));
    }
};
// Configure multer
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
// Helper function to delete old avatar
const deleteOldAvatar = (avatarUrl) => {
    if (!avatarUrl || avatarUrl.startsWith("http")) {
        return; // Don't delete URLs from external sources
    }
    const filename = path_1.default.basename(avatarUrl);
    const filepath = path_1.default.join(uploadDir, filename);
    if (fs_1.default.existsSync(filepath)) {
        fs_1.default.unlinkSync(filepath);
    }
};
exports.deleteOldAvatar = deleteOldAvatar;
