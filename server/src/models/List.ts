import mongoose, { Document, Model } from "mongoose";

interface IListMethods {
  updateTaskCount(): Promise<void>;
}

export interface IList extends Document, IListMethods {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  isDefault: boolean;
  isArchived: boolean;
  taskCount: number;
  syncVersion: number;
  lastModified: Date;
  sharedWith: Array<{
    userId: mongoose.Types.ObjectId;
    role: "viewer" | "editor";
    invitedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  updateTaskCount(): Promise<void>;
}

const listSchema = new mongoose.Schema<IList, Model<IList, {}, IListMethods>>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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
          type: mongoose.Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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
  const Task = mongoose.model("Task");
  this.taskCount = await Task.countDocuments({
    listId: this._id,
    status: { $ne: "done" },
  });
  await this.save();
};

const List = mongoose.model<IList>("List", listSchema);

export default List;
