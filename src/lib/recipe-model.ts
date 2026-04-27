import mongoose, { type Document, type Model } from 'mongoose';
import type { TCreateRecipeInput } from './schemas/recipe';

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
    title: { type: String, required: true, trim: true },
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

export const RecipeModel: Model<TCreateRecipeInput & Document> =
  (mongoose.models['Recipe'] as Model<TCreateRecipeInput & Document> | undefined) ??
  mongoose.model<TCreateRecipeInput & Document>('Recipe', recipeMongooseSchema);