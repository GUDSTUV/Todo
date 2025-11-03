import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  readAt?: Date;
  conversationId: string; // Generated from sorted user IDs for grouping
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageModel extends Model<IMessage> {
  generateConversationId(_userId1: string, _userId2: string): string;
}

const messageSchema = new Schema<IMessage, IMessageModel>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient conversation queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

// Helper method to generate conversation ID from two user IDs
messageSchema.statics.generateConversationId = function (
  userId1: string,
  userId2: string
): string {
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

export default mongoose.model<IMessage, IMessageModel>(
  "Message",
  messageSchema
);
