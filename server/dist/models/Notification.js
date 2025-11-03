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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    taskId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Task",
        index: true,
    },
    type: {
        type: String,
        enum: [
            "reminder",
            "task_due",
            "task_overdue",
            "shared_list",
            "list_shared",
            "comment",
            "mention",
            "message",
            "system",
        ],
        required: true,
    },
    title: {
        type: String,
        required: [true, "Notification title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
        type: String,
        required: [true, "Notification message is required"],
        trim: true,
        maxlength: [500, "Message cannot exceed 500 characters"],
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    actionUrl: {
        type: String,
        trim: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
// Compound indexes for common queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, taskId: 1 });
// Auto-delete old read notifications after 30 days
notificationSchema.index({ createdAt: 1 }, {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { read: true },
});
const Notification = mongoose_1.default.model("Notification", notificationSchema);
exports.default = Notification;
