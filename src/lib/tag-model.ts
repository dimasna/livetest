import mongoose, { type Document, type Model } from 'mongoose';

const tagMongooseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true },
);

tagMongooseSchema.index({ name: 1 }, { unique: true });

export const TagModel: Model<Document> =
  (mongoose.models['Tag'] as Model<Document> | undefined) ??
  mongoose.model<Document>('Tag', tagMongooseSchema);