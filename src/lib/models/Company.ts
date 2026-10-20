import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  nameNormalized?: string;
  industry?: string;
  category: string;
  lenderCategories: {
    lender: string;
    category: string;
    multiplier?: number;
    maxLoan?: number;
  }[];
  minSalary?: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema<ICompany> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true,
    },
    nameNormalized: {
      type: String,
      index: true,
    },
    industry: {
      type: String,
      default: "Corporate Enterprise",
    },
    category: {
      type: String,
      default: "Cat A",
      index: true,
    },
    lenderCategories: [
      {
        lender: { type: String, required: true },
        category: { type: String, required: true },
        multiplier: { type: Number, default: 20 },
        maxLoan: { type: Number, default: 5000000 },
      },
    ],
    minSalary: {
      type: Number,
      default: 25000,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

CompanySchema.index({ name: 1 });
CompanySchema.index({ nameNormalized: 1 });
CompanySchema.index({ category: 1 });
CompanySchema.index({ "lenderCategories.lender": 1 });
CompanySchema.index({ name: "text" });

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
