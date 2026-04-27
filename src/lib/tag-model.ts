import mongoose, { type Document, type Model } from 'mongoose';

export interface ITagDocument extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const tagMongooseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

export const TagModel: Model<ITagDocument> =
  (mongoose.models['Tag'] as Model<ITagDocument> | undefined) ??
  mongoose.model<ITagDocument>('Tag', tagMongooseSchema);