import mongoose, { Document, Schema } from "mongoose";

export interface ISubtask {
  title: string;
  done: boolean;
  _id?: mongoose.Types.ObjectId;
}

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  listId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  subtasks: ISubtask[];
  dueDate?: Date;
  reminderDate?: Date;
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: Date;
  };
  order: number;
  attachments: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  completedAt?: Date;
  syncVersion: number;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    listId: {
      type: Schema.Types.ObjectId,
      ref: "List",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [500, "Title cannot exceed 500 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
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
        enum: ["daily", "weekly", "monthly", "yearly"],
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
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        mimeType: String,
      },
    ],
    completedAt: Date,
    syncVersion: {
      type: Number,
      default: 0,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
taskSchema.index({ userId: 1, status: 1, order: 1 });
taskSchema.index({ userId: 1, listId: 1, order: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, tags: 1 });

// Update lastModified on save
taskSchema.pre("save", function (next) {
  this.lastModified = new Date();
  this.syncVersion += 1;

  // Update completedAt when status changes to done
  if (
    this.isModified("status") &&
    this.status === "done" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  } else if (this.isModified("status") && this.status !== "done") {
    this.completedAt = undefined;
  }

  next();
});

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;
