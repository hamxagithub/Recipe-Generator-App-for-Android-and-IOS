// Core types for Recipe Generator App

export interface Ingredient {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number; // in minutes
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
  tags: string[];
  nutrition?: NutritionInfo;
  rating?: number;
  createdAt: Date;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
  sodium: number; // in mg
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  tastePreferences: string[];
  cuisinePreferences: string[];
  spiceLevel: 'Mild' | 'Medium' | 'Hot';
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  savedRecipes: string[];
  createdRecipes: string[];
}

export interface RecipeGenerationRequest {
  ingredients: string[];
  preferences?: UserPreferences;
  excludeIngredients?: string[];
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
  cookingTime?: number;
  servings?: number;
}

export interface ImageRecognitionResult {
  ingredients: string[];
  confidence: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


export interface ImageRecognitionRequest {
  imageUri: string;
  apiKey?: string; // Optional API key for external services
}