import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  type:
    | "reminder"
    | "task_due"
    | "task_overdue"
    | "shared_list"
    | "list_shared"
    | "comment"
    | "mention"
    | "message"
    | "system";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    taskTitle?: string;
    listName?: string;
    priority?: string;
    listId?: string;
    messageId?: string;
    senderId?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, taskId: 1 });

// Auto-delete old read notifications after 30 days
notificationSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { read: true },
  }
);

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
