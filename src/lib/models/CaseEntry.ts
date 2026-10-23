import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICaseEntry extends Document {
  customerId: string;
  name: string;
  bankName: string;
  location: string;
  status: "DISBURSED" | "LOGIN" | "HOLD" | "REJECTED" | "CANCELLED" | "APPROVED";
  applicationNo?: string;
  remarks?: string;
  contactNo?: string;
  product?: string;
  panCard?: string;
  appliedAmount?: number;
  approvedAmount?: number;
  lastUpdateDate?: Date;
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CaseEntrySchema: Schema<ICaseEntry> = new Schema(
  {
    customerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      index: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["DISBURSED", "LOGIN", "HOLD", "REJECTED", "CANCELLED", "APPROVED"],
      default: "LOGIN",
      index: true,
    },
    applicationNo: {
      type: String,
      default: "",
      trim: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    contactNo: {
      type: String,
      default: "",
      trim: true,
    },
    product: {
      type: String,
      default: "Personal Loan",
      trim: true,
    },
    panCard: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    appliedAmount: {
      type: Number,
      default: 0,
    },
    approvedAmount: {
      type: Number,
      default: 0,
    },
    lastUpdateDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      default: "superadmin",
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

// High-performance compound indexes for private cases vault
CaseEntrySchema.index({ isDeleted: 1, createdAt: -1 });
CaseEntrySchema.index({ isDeleted: 1, status: 1, createdAt: -1 });
CaseEntrySchema.index({ isDeleted: 1, bankName: 1, createdAt: -1 });
CaseEntrySchema.index({ isDeleted: 1, customerId: 1 });

// Prevent mongoose model recompilation in Next.js hot reload
const CaseEntry: Model<ICaseEntry> =
  mongoose.models.CaseEntry ||
  mongoose.model<ICaseEntry>("CaseEntry", CaseEntrySchema);

export default CaseEntry;
