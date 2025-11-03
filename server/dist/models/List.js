"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const listSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    color: {
        type: String,
        default: "#3b82f6",
    },
    icon: {
        type: String,
        default: "📝",
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
    sharedWith: [
        {
            userId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            role: {
                type: String,
                enum: ["viewer", "editor"],
                default: "viewer",
            },
            invitedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
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
