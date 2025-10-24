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
const subtaskSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    done: {
        type: Boolean,
        default: false,
    },
}, { _id: true });
const taskSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    listId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'List',
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo',
        index: true,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true,
    },
    tags: {
        type: [String],
        default: [],
        index: true,
    },
    subtasks: {
        type: [subtaskSchema],
        default: [],
    },
    dueDate: {
        type: Date,
        index: true,
    },
    reminderDate: {
        type: Date,
    },
    recurrence: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly'],
        },
        interval: {
            type: Number,
            min: 1,
        },
        endDate: Date,
    },
    order: {
        type: Number,
        default: 0,
        index: true,
    },
    attachments: [{
            name: String,
            url: String,
            size: Number,
            mimeType: String,
        }],
    completedAt: Date,
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
// Compound indexes for common queries
taskSchema.index({ userId: 1, status: 1, order: 1 });
taskSchema.index({ userId: 1, listId: 1, order: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, tags: 1 });
// Update lastModified on save
taskSchema.pre('save', function (next) {
    this.lastModified = new Date();
    this.syncVersion += 1;
    // Update completedAt when status changes to done
    if (this.isModified('status') && this.status === 'done' && !this.completedAt) {
        this.completedAt = new Date();
    }
    else if (this.isModified('status') && this.status !== 'done') {
        this.completedAt = undefined;
    }
    next();
});
const Task = mongoose_1.default.model('Task', taskSchema);
exports.default = Task;
