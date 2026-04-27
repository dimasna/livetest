import mongoose, { type Document, type Model } from 'mongoose';

export interface IRecipeDocument extends Document {
  title: string;
  description: string;
  servings: number;
  prepMin: number;
  cookMin: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  ingredients: { name: string; qty: number; unit: string }[];
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ingredientMongooseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const recipeMongooseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true },
    servings: { type: Number, required: true },
    prepMin: { type: Number, required: true },
    cookMin: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    tags: { type: [String], default: [] },
    ingredients: { type: [ingredientMongooseSchema], default: [] },
    steps: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export const RecipeModel: Model<IRecipeDocument> =
  (mongoose.models['Recipe'] as Model<IRecipeDocument> | undefined) ??
  mongoose.model<IRecipeDocument>('Recipe', recipeMongooseSchema);