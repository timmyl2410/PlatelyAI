/**
 * MEALS MODEL
 * 
 * Shared types for AI-generated meal suggestions.
 * Used by web and mobile apps.
 * 
 * CANONICAL SCHEMA:
 * - meals/{uid}/generated/{mealId} = MealDoc
 */

import type { FirestoreTimestamp } from './inventory.js';

/**
 * Document: meals/{uid}/generated/{mealId}
 * AI-generated meal with recipe details
 */
export interface MealDoc {
  createdAt: Date | FirestoreTimestamp;
  title: string;
  macros?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  ingredientsUsed: string[]; // Ingredients from user's inventory
  recipeText: string; // Full recipe instructions
  imagePath?: string; // Optional meal image
}

/**
 * @deprecated Legacy type for old schema migration
 */
export interface Meal {
  id: string;
  uid: string;
  name: string;
  description?: string;
  ingredients: string[];
  instructions?: string[];
  imageUrl?: string;
  cookingTime?: string;
  servings?: number;
  tags?: string[];
  generatedAt: Date | FirestoreTimestamp;
  usedIngredients?: string[]; // Ingredients from user's inventory
}

export interface MealGenerationRequest {
  uid: string;
  inventoryItems: string[];
  dietaryRestrictions?: string[];
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  preferences?: string;
}

export interface MealGenerationResult {
  meal: MealDoc;
  usedCredits: number;
  remainingCredits: number;
}
