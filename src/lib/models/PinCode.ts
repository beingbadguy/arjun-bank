import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPinCode extends Document {
  pincode: string;
  area: string;
  city: string;
  state: string;
  lenders: {
    lender: string;
    isServiceable: boolean;
    branchName: string;
    category?: string;
    products: string[];
    tatDays?: number;
  }[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PinCodeSchema: Schema<IPinCode> = new Schema(
  {
    pincode: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    lenders: [
      {
        lender: { type: String, required: true },
        isServiceable: { type: Boolean, default: true },
        branchName: { type: String, default: "Main Branch" },
        category: { type: String, default: "Standard" },
        products: { type: [String], default: ["Personal Loan", "Home Loan", "LAP"] },
        tatDays: { type: Number, default: 3 },
      },
    ],
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

// High-performance compound indexes for search & filtering
PinCodeSchema.index({ isDeleted: 1, pincode: 1 });
PinCodeSchema.index({ isDeleted: 1, city: 1, pincode: 1 });
PinCodeSchema.index({ isDeleted: 1, state: 1 });
PinCodeSchema.index({ isDeleted: 1, "lenders.lender": 1 });
PinCodeSchema.index({ pincode: "text", city: "text", area: "text", state: "text" });

const PinCode: Model<IPinCode> =
  mongoose.models.PinCode || mongoose.model<IPinCode>("PinCode", PinCodeSchema);

export default PinCode;
