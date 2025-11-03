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
const mongoose_1 = __importStar(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const listInviteSchema = new mongoose_1.Schema({
    listId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "List",
        required: true,
        index: true,
    },
    invitedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    role: {
        type: String,
        enum: ["viewer", "editor"],
        default: "viewer",
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "expired"],
        default: "pending",
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    acceptedAt: {
        type: Date,
    },
    acceptedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
});
// Compound indexes for efficient queries
listInviteSchema.index({ email: 1, listId: 1 });
listInviteSchema.index({ token: 1, status: 1 });
// Static method to generate a unique token
listInviteSchema.statics.generateToken = function () {
    return crypto_1.default.randomBytes(32).toString("hex");
};
// Instance method to check if invite is valid
listInviteSchema.methods.isValid = function () {
    return this.status === "pending" && this.expiresAt > new Date();
};
exports.default = mongoose_1.default.model("ListInvite", listInviteSchema);
