import mongoose, { Document, Schema } from "mongoose";
import crypto from "crypto";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; // optional for OAuth users
  googleId?: string; // present for Google OAuth users
  avatarUrl?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  preferences: {
    theme: "light" | "dark" | "system";
    timezone: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  getResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allow multiple docs without googleId
    },

    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHash: {
      type: String,
      required: function () {
        // require password if not a Google OAuth account
        return !(this as any).googleId;
      },
    },
    avatarUrl: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      language: {
        type: String,
        default: "en",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function (): string {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire to 10 minutes
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Index for fast email lookups
userSchema.index({ email: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;
