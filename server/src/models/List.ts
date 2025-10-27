import mongoose, { Document, Schema } from "mongoose";

export interface IList extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<IList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  },
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
