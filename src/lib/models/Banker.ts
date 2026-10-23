import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanker extends Document {
  name: string;
  bankName: string;
  designation: string;
  branch: string;
  city: string;
  phone: string;
  email: string;
  productsHandled: string[];
  isVerified: boolean;
  isDemo: boolean;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BankerSchema: Schema<IBanker> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Banker name is required"],
      trim: true,
      index: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank institution name is required"],
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, "Branch location is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Contact phone is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    productsHandled: {
      type: [String],
      default: ["Personal Loan"],
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      default: "",
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

// Compound text index for robust searching
BankerSchema.index({
  name: "text",
  bankName: "text",
  branch: "text",
  city: "text",
  designation: "text",
});

// High-performance compound indexes for sorting and filtering
BankerSchema.index({ isDeleted: 1, isDemo: 1, createdAt: -1 });
BankerSchema.index({ isDeleted: 1, bankName: 1 });
BankerSchema.index({ isDeleted: 1, city: 1 });

const Banker: Model<IBanker> =
  mongoose.models.Banker || mongoose.model<IBanker>("Banker", BankerSchema);

export default Banker;
