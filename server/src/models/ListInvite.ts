import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";

export interface IListInvite extends Document {
  listId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  email: string;
  role: "viewer" | "editor";
  token: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const listInviteSchema = new Schema<IListInvite>(
  {
    listId: {
      type: Schema.Types.ObjectId,
      ref: "List",
      required: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor"],
      default: "viewer",
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
listInviteSchema.index({ email: 1, listId: 1 });
listInviteSchema.index({ token: 1, status: 1 });

// Static method to generate a unique token
listInviteSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString("hex");
};

// Instance method to check if invite is valid
listInviteSchema.methods.isValid = function (): boolean {
  return this.status === "pending" && this.expiresAt > new Date();
};

export default mongoose.model<IListInvite>("ListInvite", listInviteSchema);
