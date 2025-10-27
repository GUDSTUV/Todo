import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; // optional for OAuth users
  googleId?: string; // present for Google OAuth users
  avatarUrl?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    timezone: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
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
  },
);

// Index for fast email lookups
userSchema.index({ email: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;
