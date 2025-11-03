import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId; // User who performed the action
  taskId?: mongoose.Types.ObjectId; // Related task (if applicable)
  listId?: mongoose.Types.ObjectId; // Related list (if applicable)
  type:
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "task_status_changed"
    | "task_assigned"
    | "comment_added"
    | "list_created"
    | "list_shared"
    | "collaborator_added"
    | "collaborator_removed";
  description: string; // Human-readable description
  metadata?: Record<string, any>; // Additional data (old/new values, etc.)
  visibility: "private" | "team"; // Who can see this activity
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
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
    listId: {
      type: Schema.Types.ObjectId,
      ref: "List",
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "task_created",
        "task_updated",
        "task_deleted",
        "task_status_changed",
        "task_assigned",
        "comment_added",
        "list_created",
        "list_shared",
        "collaborator_added",
        "collaborator_removed",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    visibility: {
      type: String,
      enum: ["private", "team"],
      default: "team",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ listId: 1, createdAt: -1 });
activitySchema.index({ taskId: 1, createdAt: -1 });

const Activity = mongoose.model<IActivity>("Activity", activitySchema);

export default Activity;
