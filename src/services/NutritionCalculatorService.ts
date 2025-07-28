import { NutritionInfo, Ingredient } from '../types';

interface NutritionData {
  [key: string]: {
    calories: number; // per 100g
    protein: number;  // per 100g
    carbs: number;    // per 100g
    fat: number;      // per 100g
    fiber: number;    // per 100g
    sugar: number;    // per 100g
    sodium: number;   // per 100g (mg)
  };
}

class NutritionCalculatorService {
  // Basic nutrition database - in a real app, this would come from a comprehensive API
  private nutritionDB: NutritionData = {
    // Vegetables
    'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 },
    'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4 },
    'garlic': { calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1, sugar: 1.0, sodium: 17 },
    'potato': { calories: 77, protein: 2.0, carbs: 17.5, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6 },
    'carrot': { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69 },
    'bell pepper': { calories: 31, protein: 1.0, carbs: 7.3, fat: 0.3, fiber: 2.5, sugar: 4.2, sodium: 4 },
    'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 },
    'broccoli': { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, sugar: 1.5, sodium: 33 },
    'cucumber': { calories: 16, protein: 0.7, carbs: 4.0, fat: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2 },
    'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sugar: 0.8, sodium: 28 },

    // Proteins
    'chicken': { calories: 239, protein: 27.3, carbs: 0, fat: 13.6, fiber: 0, sugar: 0, sodium: 82 },
    'beef': { calories: 250, protein: 26.1, carbs: 0, fat: 15.4, fiber: 0, sugar: 0, sodium: 72 },
    'fish': { calories: 206, protein: 22.0, carbs: 0, fat: 12.4, fiber: 0, sugar: 0, sodium: 59 },
    'egg': { calories: 155, protein: 13.0, carbs: 1.1, fat: 10.6, fiber: 0, sugar: 1.1, sodium: 124 },
    'tofu': { calories: 76, protein: 8.1, carbs: 1.9, fat: 4.8, fiber: 0.3, sugar: 0.6, sodium: 7 },

    // Dairy
    'milk': { calories: 42, protein: 3.4, carbs: 5.0, fat: 1.0, fiber: 0, sugar: 5.0, sodium: 44 },
    'cheese': { calories: 113, protein: 7.1, carbs: 1.0, fat: 9.0, fiber: 0, sugar: 1.0, sodium: 621 },
    'yogurt': { calories: 59, protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2, sodium: 36 },

    // Grains and Starches
    'rice': { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 5 },
    'pasta': { calories: 131, protein: 5.0, carbs: 25.0, fat: 1.1, fiber: 1.8, sugar: 0.6, sodium: 6 },
    'bread': { calories: 265, protein: 9.0, carbs: 49.0, fat: 3.2, fiber: 2.7, sugar: 5.0, sodium: 491 },
    'quinoa': { calories: 120, protein: 4.4, carbs: 22.0, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 7 },

    // Oils and Fats
    'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 2 },
    'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0, sugar: 0.1, sodium: 11 },

    // Fruits
    'apple': { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1 },
    'banana': { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1 },
    'lemon': { calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, sugar: 1.5, sodium: 2 },

    // Herbs and Spices (typical serving amounts)
    'basil': { calories: 22, protein: 3.2, carbs: 2.6, fat: 0.6, fiber: 1.6, sugar: 0.3, sodium: 4 },
    'oregano': { calories: 265, protein: 9.0, carbs: 68.9, fat: 4.3, fiber: 42.5, sugar: 4.1, sodium: 25 },
    'thyme': { calories: 101, protein: 5.6, carbs: 24.5, fat: 1.7, fiber: 14.0, sugar: 1.7, sodium: 9 },
  };

  /**
   * Calculate nutrition for a complete recipe
   */
  calculateRecipeNutrition(ingredients: Ingredient[], servings: number = 1): NutritionInfo {
    let totalNutrition: NutritionInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    ingredients.forEach(ingredient => {
      const ingredientNutrition = this.calculateIngredientNutrition(ingredient);
      
      totalNutrition.calories += ingredientNutrition.calories;
      totalNutrition.protein += ingredientNutrition.protein;
      totalNutrition.carbs += ingredientNutrition.carbs;
      totalNutrition.fat += ingredientNutrition.fat;
      totalNutrition.fiber += ingredientNutrition.fiber;
      totalNutrition.sugar += ingredientNutrition.sugar;
      totalNutrition.sodium += ingredientNutrition.sodium;
    });

    // Divide by servings to get per-serving nutrition
    if (servings > 1) {
      totalNutrition.calories = Math.round(totalNutrition.calories / servings);
      totalNutrition.protein = Math.round((totalNutrition.protein / servings) * 10) / 10;
      totalNutrition.carbs = Math.round((totalNutrition.carbs / servings) * 10) / 10;
      totalNutrition.fat = Math.round((totalNutrition.fat / servings) * 10) / 10;
      totalNutrition.fiber = Math.round((totalNutrition.fiber / servings) * 10) / 10;
      totalNutrition.sugar = Math.round((totalNutrition.sugar / servings) * 10) / 10;
      totalNutrition.sodium = Math.round(totalNutrition.sodium / servings);
    }

    return totalNutrition;
  }

  /**
   * Calculate nutrition for a single ingredient
   */
  private calculateIngredientNutrition(ingredient: Ingredient): NutritionInfo {
    const normalizedName = ingredient.name.toLowerCase().trim();
    const baseNutrition = this.nutritionDB[normalizedName];
    
    if (!baseNutrition) {
      // Return estimated values for unknown ingredients
      return this.getEstimatedNutrition(normalizedName);
    }

    // Convert quantity to grams
    const quantityInGrams = this.convertToGrams(ingredient.quantity || '100', ingredient.unit || 'g');
    const factor = quantityInGrams / 100; // Base nutrition is per 100g

    return {
      calories: Math.round(baseNutrition.calories * factor),
      protein: Math.round((baseNutrition.protein * factor) * 10) / 10,
      carbs: Math.round((baseNutrition.carbs * factor) * 10) / 10,
      fat: Math.round((baseNutrition.fat * factor) * 10) / 10,
      fiber: Math.round((baseNutrition.fiber * factor) * 10) / 10,
      sugar: Math.round((baseNutrition.sugar * factor) * 10) / 10,
      sodium: Math.round(baseNutrition.sodium * factor)
    };
  }

  /**
   * Convert various units to grams
   */
  private convertToGrams(quantity: string, unit: string): number {
    const numericQuantity = parseFloat(quantity.replace(/[^0-9.]/g, '')) || 100;
    const normalizedUnit = unit.toLowerCase().trim();

    const conversions: { [key: string]: number } = {
      'g': 1,
      'gram': 1,
      'grams': 1,
      'kg': 1000,
      'kilogram': 1000,
      'kilograms': 1000,
      'lb': 453.592,
      'pound': 453.592,
      'pounds': 453.592,
      'oz': 28.3495,
      'ounce': 28.3495,
      'ounces': 28.3495,
      
      // Volume to weight (approximate)
      'ml': 1, // Assuming water-like density
      'milliliter': 1,
      'milliliters': 1,
      'l': 1000,
      'liter': 1000,
      'liters': 1000,
      'cup': 240,
      'cups': 240,
      'tbsp': 15,
      'tablespoon': 15,
      'tablespoons': 15,
      'tsp': 5,
      'teaspoon': 5,
      'teaspoons': 5,
      
      // Pieces (estimated weights)
      'piece': 100,
      'pieces': 100,
      'item': 100,
      'items': 100,
      'small': 80,
      'medium': 150,
      'large': 200,
      'clove': 3, // for garlic
      'cloves': 3,
    };

    return numericQuantity * (conversions[normalizedUnit] || 100);
  }

  /**
   * Provide estimated nutrition for unknown ingredients
   */
  private getEstimatedNutrition(ingredientName: string): NutritionInfo {
    // Basic estimates based on ingredient type
    if (this.isVegetable(ingredientName)) {
      return { calories: 25, protein: 2, carbs: 5, fat: 0.2, fiber: 2, sugar: 3, sodium: 10 };
    } else if (this.isFruit(ingredientName)) {
      return { calories: 50, protein: 0.5, carbs: 12, fat: 0.2, fiber: 2, sugar: 8, sodium: 1 };
    } else if (this.isProtein(ingredientName)) {
      return { calories: 200, protein: 20, carbs: 0, fat: 10, fiber: 0, sugar: 0, sodium: 70 };
    } else if (this.isGrain(ingredientName)) {
      return { calories: 120, protein: 3, carbs: 25, fat: 1, fiber: 2, sugar: 1, sodium: 5 };
    } else if (this.isDairy(ingredientName)) {
      return { calories: 80, protein: 5, carbs: 4, fat: 4, fiber: 0, sugar: 4, sodium: 50 };
    }
    
    // Default estimate
    return { calories: 50, protein: 2, carbs: 8, fat: 1, fiber: 1, sugar: 2, sodium: 20 };
  }

  private isVegetable(name: string): boolean {
    const vegetables = ['vegetable', 'cabbage', 'kale', 'celery', 'radish', 'turnip', 'beet'];
    return vegetables.some(veg => name.includes(veg)) || name.endsWith('s') && name.length > 4;
  }

  private isFruit(name: string): boolean {
    const fruits = ['fruit', 'berry', 'orange', 'grape', 'peach', 'pear', 'cherry'];
    return fruits.some(fruit => name.includes(fruit));
  }

  private isProtein(name: string): boolean {
    const proteins = ['meat', 'protein', 'turkey', 'duck', 'lamb', 'pork', 'salmon', 'tuna'];
    return proteins.some(protein => name.includes(protein));
  }

  private isGrain(name: string): boolean {
    const grains = ['grain', 'wheat', 'barley', 'oats', 'flour', 'noodle'];
    return grains.some(grain => name.includes(grain));
  }

  private isDairy(name: string): boolean {
    const dairy = ['dairy', 'cream', 'sour cream', 'cottage cheese', 'mozzarella'];
    return dairy.some(item => name.includes(item));
  }

  /**
   * Get nutrition information for a specific ingredient
   */
  getIngredientNutritionInfo(ingredientName: string): NutritionInfo | null {
    const normalizedName = ingredientName.toLowerCase().trim();
    const baseNutrition = this.nutritionDB[normalizedName];
    
    if (!baseNutrition) {
      return null;
    }

    return { ...baseNutrition };
  }

  /**
   * Add custom nutrition data for new ingredients
   */
  addCustomNutritionData(ingredientName: string, nutritionData: NutritionInfo): void {
    this.nutritionDB[ingredientName.toLowerCase().trim()] = { ...nutritionData };
  }

  /**
   * Get all available ingredients in nutrition database
   */
  getAvailableIngredients(): string[] {
    return Object.keys(this.nutritionDB);
  }

  /**
   * Calculate daily nutrition percentage values
   */
  calculateDailyValues(nutrition: NutritionInfo): { [key: string]: number } {
    // Based on 2000 calorie diet daily values
    const dailyValues = {
      calories: 2000,
      protein: 50,    // grams
      carbs: 300,     // grams
      fat: 65,        // grams
      fiber: 25,      // grams
      sodium: 2300    // mg
    };

    return {
      calories: Math.round((nutrition.calories / dailyValues.calories) * 100),
      protein: Math.round((nutrition.protein / dailyValues.protein) * 100),
      carbs: Math.round((nutrition.carbs / dailyValues.carbs) * 100),
      fat: Math.round((nutrition.fat / dailyValues.fat) * 100),
      fiber: Math.round((nutrition.fiber / dailyValues.fiber) * 100),
      sodium: Math.round((nutrition.sodium / dailyValues.sodium) * 100)
    };
  }
}

export default new NutritionCalculatorService();
