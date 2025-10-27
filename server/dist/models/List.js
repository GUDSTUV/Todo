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
const listSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, "List name is required"],
        trim: true,
        maxlength: [100, "List name cannot exceed 100 characters"],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
    },
    color: {
        type: String,
        default: "#3B82F6", // Blue
        match: [/^#[0-9A-F]{6}$/i, "Color must be a valid hex color"],
    },
    icon: {
        type: String,
        default: "list",
    },
    order: {
        type: Number,
        default: 0,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true,
    },
    taskCount: {
        type: Number,
        default: 0,
    },
    syncVersion: {
        type: Number,
        default: 0,
    },
    lastModified: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Compound indexes for queries
listSchema.index({ userId: 1, isArchived: 1, order: 1 });
listSchema.index({ userId: 1, isDefault: 1 });
// Update lastModified on save
listSchema.pre("save", function (next) {
    this.lastModified = new Date();
    this.syncVersion += 1;
    next();
});
// Method to update task count
listSchema.methods.updateTaskCount = async function () {
    const Task = mongoose_1.default.model("Task");
    this.taskCount = await Task.countDocuments({
        listId: this._id,
        status: { $ne: "done" },
    });
    await this.save();
};
const List = mongoose_1.default.model("List", listSchema);
exports.default = List;
