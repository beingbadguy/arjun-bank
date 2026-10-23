import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "superadmin" | "operator" | "analyst";
  status: "active" | "inactive";
  createdBy: string;
  lastLogin?: Date;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["superadmin", "operator", "analyst"],
      default: "operator",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: String,
      default: "system",
    },
    lastLogin: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound index for user listing
UserSchema.index({ isDeleted: 1, createdAt: -1 });

// Prevent mongoose model overwrite in Next.js hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
