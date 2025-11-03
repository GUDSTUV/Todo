import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  mentions: mongoose.Types.ObjectId[]; // Users mentioned in the comment
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
commentSchema.index({ taskId: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
