import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUtmLink extends Document {
  tagName: string;
  url: string;
  category: string;
  description: string;
  clicks: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const UtmLinkSchema: Schema<IUtmLink> = new Schema(
  {
    tagName: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, "Target UTM URL is required"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "Poonawalla Fincorp",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    clicks: {
      type: Number,
      default: 0,
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
    createdBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Text index for fast multi-field searching
UtmLinkSchema.index({
  tagName: "text",
  url: "text",
  category: "text",
  description: "text",
});

// Compound indexes for active list querying and sorting
UtmLinkSchema.index({ isDeleted: 1, createdAt: -1 });
UtmLinkSchema.index({ isDeleted: 1, category: 1 });

const UtmLink: Model<IUtmLink> =
  mongoose.models.UtmLink || mongoose.model<IUtmLink>("UtmLink", UtmLinkSchema);

export default UtmLink;
