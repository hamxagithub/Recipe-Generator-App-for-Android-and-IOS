import { NutritionInfo, Ingredient } from '../types';
import axios from 'axios';

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

interface ExternalNutritionData {
  [key: string]: any;
}

class NutritionCalculatorService {
  // Enhanced nutrition database with more ingredients
  private nutritionDB: NutritionData = {
    // Vegetables
    'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 },
    'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4 },
    'garlic': { calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1, sugar: 1.0, sodium: 17 },
    'potato': { calories: 77, protein: 2.0, carbs: 17.5, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6 },
    'sweet potato': { calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0, sugar: 4.2, sodium: 6 },
    'carrot': { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69 },
    'bell pepper': { calories: 31, protein: 1.0, carbs: 7.3, fat: 0.3, fiber: 2.5, sugar: 4.2, sodium: 4 },
    'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 },
    'broccoli': { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, sugar: 1.5, sodium: 33 },
    'cucumber': { calories: 16, protein: 0.7, carbs: 4.0, fat: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2 },
    'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sugar: 0.8, sodium: 28 },
    'zucchini': { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1.0, sugar: 2.5, sodium: 8 },
    'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0, sugar: 2.0, sodium: 5 },
    'celery': { calories: 16, protein: 0.7, carbs: 3.0, fat: 0.2, fiber: 1.6, sugar: 1.3, sodium: 80 },
    'cauliflower': { calories: 25, protein: 1.9, carbs: 5.0, fat: 0.3, fiber: 2.0, sugar: 1.9, sodium: 30 },

    // Proteins
    'chicken breast': { calories: 165, protein: 31.0, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 },
    'chicken thigh': { calories: 209, protein: 26.0, carbs: 0, fat: 10.9, fiber: 0, sugar: 0, sodium: 84 },
    'chicken': { calories: 239, protein: 27.3, carbs: 0, fat: 13.6, fiber: 0, sugar: 0, sodium: 82 },
    'ground beef': { calories: 254, protein: 26.1, carbs: 0, fat: 15.7, fiber: 0, sugar: 0, sodium: 75 },
    'beef': { calories: 250, protein: 26.1, carbs: 0, fat: 15.4, fiber: 0, sugar: 0, sodium: 72 },
    'salmon': { calories: 208, protein: 25.4, carbs: 0, fat: 12.4, fiber: 0, sugar: 0, sodium: 59 },
    'tuna': { calories: 184, protein: 30.0, carbs: 0, fat: 6.3, fiber: 0, sugar: 0, sodium: 47 },
    'fish': { calories: 206, protein: 22.0, carbs: 0, fat: 12.4, fiber: 0, sugar: 0, sodium: 59 },
    'egg': { calories: 155, protein: 13.0, carbs: 1.1, fat: 10.6, fiber: 0, sugar: 1.1, sodium: 124 },
    'tofu': { calories: 76, protein: 8.1, carbs: 1.9, fat: 4.8, fiber: 0.3, sugar: 0.6, sodium: 7 },
    'black beans': { calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, fiber: 8.7, sugar: 0.3, sodium: 2 },
    'lentils': { calories: 116, protein: 9.0, carbs: 20.1, fat: 0.4, fiber: 7.9, sugar: 1.8, sodium: 2 },
    'chickpeas': { calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, sugar: 4.8, sodium: 7 },

    // Dairy
    'milk': { calories: 42, protein: 3.4, carbs: 5.0, fat: 1.0, fiber: 0, sugar: 5.0, sodium: 44 },
    'whole milk': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 4.8, sodium: 43 },
    'cheese': { calories: 113, protein: 7.1, carbs: 1.0, fat: 9.0, fiber: 0, sugar: 1.0, sodium: 621 },
    'cheddar cheese': { calories: 403, protein: 24.9, carbs: 1.3, fat: 33.1, fiber: 0, sugar: 0.5, sodium: 621 },
    'mozzarella': { calories: 280, protein: 22.2, carbs: 2.2, fat: 17.1, fiber: 0, sugar: 1.0, sodium: 627 },
    'yogurt': { calories: 59, protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2, sodium: 36 },
    'greek yogurt': { calories: 97, protein: 9.0, carbs: 3.9, fat: 5.0, fiber: 0, sugar: 3.2, sodium: 35 },
    'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0, sugar: 0.1, sodium: 11 },

    // Grains and Starches
    'white rice': { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 5 },
    'brown rice': { calories: 123, protein: 2.3, carbs: 23.0, fat: 0.9, fiber: 1.8, sugar: 0.7, sodium: 3 },
    'rice': { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 5 },
    'pasta': { calories: 131, protein: 5.0, carbs: 25.0, fat: 1.1, fiber: 1.8, sugar: 0.6, sodium: 6 },
    'whole wheat pasta': { calories: 124, protein: 5.0, carbs: 25.1, fat: 1.4, fiber: 3.2, sugar: 0.8, sodium: 3 },
    'bread': { calories: 265, protein: 9.0, carbs: 49.0, fat: 3.2, fiber: 2.7, sugar: 5.0, sodium: 491 },
    'whole grain bread': { calories: 247, protein: 13.4, carbs: 41.3, fat: 4.2, fiber: 7.0, sugar: 5.6, sodium: 491 },
    'quinoa': { calories: 120, protein: 4.4, carbs: 22.0, fat: 1.9, fiber: 2.8, sugar: 0.9, sodium: 7 },
    'oats': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, sugar: 0.99, sodium: 2 },
    'barley': { calories: 123, protein: 2.3, carbs: 28.2, fat: 0.4, fiber: 3.8, sugar: 0.8, sodium: 3 },

    // Oils and Fats
    'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 2 },
    'vegetable oil': { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 0 },
    'coconut oil': { calories: 862, protein: 0, carbs: 0, fat: 99.1, fiber: 0, sugar: 0, sodium: 0 },
    'avocado': { calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, sugar: 0.7, sodium: 7 },

    // Fruits
    'apple': { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1 },
    'banana': { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1 },
    'orange': { calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugar: 9.4, sodium: 0 },
    'lemon': { calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, sugar: 1.5, sodium: 2 },
    'lime': { calories: 30, protein: 0.7, carbs: 10.5, fat: 0.2, fiber: 2.8, sugar: 1.7, sodium: 2 },
    'berries': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, sugar: 10.0, sodium: 1 },
    'strawberries': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, sugar: 4.9, sodium: 1 },
    'blueberries': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, sugar: 10.0, sodium: 1 },

    // Herbs and Spices
    'basil': { calories: 22, protein: 3.2, carbs: 2.6, fat: 0.6, fiber: 1.6, sugar: 0.3, sodium: 4 },
    'oregano': { calories: 265, protein: 9.0, carbs: 68.9, fat: 4.3, fiber: 42.5, sugar: 4.1, sodium: 25 },
    'thyme': { calories: 101, protein: 5.6, carbs: 24.5, fat: 1.7, fiber: 14.0, sugar: 1.7, sodium: 9 },
    'parsley': { calories: 36, protein: 3.0, carbs: 6.3, fat: 0.8, fiber: 3.3, sugar: 0.9, sodium: 56 },
    'cilantro': { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5, fiber: 2.8, sugar: 0.9, sodium: 46 },
    'ginger': { calories: 80, protein: 1.8, carbs: 17.8, fat: 0.8, fiber: 2.0, sugar: 1.7, sodium: 13 },
    'turmeric': { calories: 354, protein: 7.8, carbs: 64.9, fat: 9.9, fiber: 21.1, sugar: 3.2, sodium: 38 },
    'cumin': { calories: 375, protein: 17.8, carbs: 44.2, fat: 22.3, fiber: 10.5, sugar: 2.3, sodium: 168 },
    'paprika': { calories: 282, protein: 14.1, carbs: 53.9, fat: 12.9, fiber: 34.9, sugar: 10.3, sodium: 68 },

    // Nuts and Seeds
    'almonds': { calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugar: 4.4, sodium: 1 },
    'walnuts': { calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, sugar: 2.6, sodium: 2 },
    'peanuts': { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2, fiber: 8.5, sugar: 4.7, sodium: 18 },
    'sunflower seeds': { calories: 584, protein: 20.8, carbs: 20.0, fat: 51.5, fiber: 8.6, sugar: 2.6, sodium: 9 },
    'chia seeds': { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, sugar: 0, sodium: 16 },
  };

  // Cache for external API results
  private nutritionCache: Map<string, NutritionData[string]> = new Map();

  constructor() {
    this.loadAdditionalNutritionData();
  }

  /**
   * Load additional nutrition data from external sources
   */
  private async loadAdditionalNutritionData(): Promise<void> {
    try {
      // Try to load from USDA FoodData Central API
      const commonIngredients = ['chicken', 'beef', 'salmon', 'broccoli', 'spinach'];
      
      for (const ingredient of commonIngredients) {
        if (!this.nutritionDB[ingredient]) {
          const nutritionData = await this.fetchNutritionFromUSDA(ingredient);
          if (nutritionData) {
            this.nutritionDB[ingredient] = nutritionData;
          }
        }
      }
    } catch (error) {
      console.log('Failed to load additional nutrition data:', error);
    }
  }

  /**
   * Fetch nutrition data from USDA FoodData Central API
   */
  private async fetchNutritionFromUSDA(ingredient: string): Promise<NutritionData[string] | null> {
    try {
      const apiKey = process.env.USDA_API_KEY || process.env.REACT_NATIVE_USDA_API_KEY;
      if (!apiKey) return null;

      const searchResponse = await axios.get(
        `https://api.nal.usda.gov/fdc/v1/foods/search`,
        {
          params: {
            query: ingredient,
            api_key: apiKey,
            pageSize: 1
          }
        }
      );

      if (searchResponse.data.foods && searchResponse.data.foods.length > 0) {
        const foodId = searchResponse.data.foods[0].fdcId;
        
        const nutritionResponse = await axios.get(
          `https://api.nal.usda.gov/fdc/v1/food/${foodId}`,
          {
            params: {
              api_key: apiKey
            }
          }
        );

        return this.parseUSDANutritionData(nutritionResponse.data);
      }
    } catch (error) {
      console.log(`Failed to fetch USDA data for ${ingredient}:`, error);
    }
    
    return null;
  }

  /**
   * Parse USDA nutrition data format
   */
  private parseUSDANutritionData(data: any): NutritionData[string] {
    const nutrients = data.foodNutrients || [];
    const nutritionData: NutritionData[string] = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    nutrients.forEach((nutrient: any) => {
      const name = nutrient.nutrient?.name?.toLowerCase() || '';
      const value = nutrient.amount || 0;

      if (name.includes('energy') || name.includes('calorie')) {
        nutritionData.calories = value;
      } else if (name.includes('protein')) {
        nutritionData.protein = value;
      } else if (name.includes('carbohydrate')) {
        nutritionData.carbs = value;
      } else if (name.includes('total lipid') || name.includes('fat')) {
        nutritionData.fat = value;
      } else if (name.includes('fiber')) {
        nutritionData.fiber = value;
      } else if (name.includes('sugar')) {
        nutritionData.sugar = value;
      } else if (name.includes('sodium')) {
        nutritionData.sodium = value;
      }
    });

    return nutritionData;
  }

  /**
   * Calculate nutrition for a complete recipe with enhanced accuracy
   */
  async calculateRecipeNutrition(ingredients: Ingredient[], servings: number = 1): Promise<NutritionInfo> {
    let totalNutrition: NutritionInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    // Process each ingredient
    for (const ingredient of ingredients) {
      const ingredientNutrition = await this.calculateIngredientNutrition(ingredient);
      
      totalNutrition.calories += ingredientNutrition.calories;
      totalNutrition.protein += ingredientNutrition.protein;
      totalNutrition.carbs += ingredientNutrition.carbs;
      totalNutrition.fat += ingredientNutrition.fat;
      totalNutrition.fiber += ingredientNutrition.fiber;
      totalNutrition.sugar += ingredientNutrition.sugar;
      totalNutrition.sodium += ingredientNutrition.sodium;
    }

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
   * Calculate nutrition for a single ingredient with external API support
   */
  private async calculateIngredientNutrition(ingredient: Ingredient): Promise<NutritionInfo> {
    const normalizedName = ingredient.name.toLowerCase().trim();
    
    // Check cache first
    if (this.nutritionCache.has(normalizedName)) {
      const cachedData = this.nutritionCache.get(normalizedName)!;
      return this.calculateWithQuantity(cachedData, ingredient);
    }
    
    // Check local database
    let baseNutrition = this.nutritionDB[normalizedName];
    
    // If not found, try fuzzy matching
    if (!baseNutrition) {
      const matchResult = this.findBestNutritionMatch(normalizedName);
      if (matchResult) {
        baseNutrition = matchResult;
      }
    }
    
    // If still not found, try external API
    if (!baseNutrition) {
      const apiNutrition = await this.fetchNutritionFromUSDA(normalizedName);
      if (apiNutrition) {
        baseNutrition = apiNutrition;
        this.nutritionCache.set(normalizedName, apiNutrition);
      }
    }
    
    // If still not found, use intelligent estimation
    if (!baseNutrition) {
      baseNutrition = this.getIntelligentNutritionEstimate(normalizedName);
    }
    
    return this.calculateWithQuantity(baseNutrition, ingredient);
  }

  /**
   * Calculate nutrition with quantity considerations
   */
  private calculateWithQuantity(baseNutrition: NutritionData[string], ingredient: Ingredient): NutritionInfo {
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
   * Find best nutrition match using fuzzy matching
   */
  private findBestNutritionMatch(ingredientName: string): NutritionData[string] | null {
    const availableIngredients = Object.keys(this.nutritionDB);
    let bestMatch = null;
    let bestScore = 0;

    availableIngredients.forEach(ingredient => {
      let score = 0;
      
      // Exact substring match
      if (ingredient.includes(ingredientName) || ingredientName.includes(ingredient)) {
        score = 0.8;
      }
      
      // Word overlap
      const ingredientWords = ingredient.split(' ');
      const inputWords = ingredientName.split(' ');
      const overlap = ingredientWords.filter(word => inputWords.includes(word)).length;
      score = Math.max(score, overlap / Math.max(ingredientWords.length, inputWords.length));
      
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = this.nutritionDB[ingredient];
      }
    });

    return bestMatch;
  }

  /**
   * Get intelligent nutrition estimate based on ingredient category
   */
  private getIntelligentNutritionEstimate(ingredientName: string): NutritionData[string] {
    const name = ingredientName.toLowerCase();
    
    // Categorize and provide estimates
    if (this.isVegetable(name)) {
      return { calories: 25, protein: 2, carbs: 5, fat: 0.2, fiber: 2, sugar: 3, sodium: 10 };
    } else if (this.isFruit(name)) {
      return { calories: 50, protein: 0.5, carbs: 12, fat: 0.2, fiber: 2, sugar: 8, sodium: 1 };
    } else if (this.isProtein(name)) {
      return { calories: 200, protein: 20, carbs: 0, fat: 10, fiber: 0, sugar: 0, sodium: 70 };
    } else if (this.isGrain(name)) {
      return { calories: 120, protein: 3, carbs: 25, fat: 1, fiber: 2, sugar: 1, sodium: 5 };
    } else if (this.isDairy(name)) {
      return { calories: 80, protein: 5, carbs: 4, fat: 4, fiber: 0, sugar: 4, sodium: 50 };
    } else if (this.isNutOrSeed(name)) {
      return { calories: 550, protein: 18, carbs: 15, fat: 45, fiber: 8, sugar: 3, sodium: 5 };
    } else if (this.isOil(name)) {
      return { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 0 };
    }
    
    // Default estimate
    return { calories: 50, protein: 2, carbs: 8, fat: 1, fiber: 1, sugar: 2, sodium: 20 };
  }

  /**
   * Enhanced unit conversion with more units
   */
  private convertToGrams(quantity: string, unit: string): number {
    const numericQuantity = parseFloat(quantity.replace(/[^0-9.]/g, '')) || 100;
    const normalizedUnit = unit.toLowerCase().trim();

    const conversions: { [key: string]: number } = {
      // Weight units
      'g': 1, 'gram': 1, 'grams': 1,
      'kg': 1000, 'kilogram': 1000, 'kilograms': 1000,
      'lb': 453.592, 'pound': 453.592, 'pounds': 453.592,
      'oz': 28.3495, 'ounce': 28.3495, 'ounces': 28.3495,
      
      // Volume units (approximate for cooking)
      'ml': 1, 'milliliter': 1, 'milliliters': 1,
      'l': 1000, 'liter': 1000, 'liters': 1000,
      'cup': 240, 'cups': 240,
      'tbsp': 15, 'tablespoon': 15, 'tablespoons': 15, 'tbs': 15,
      'tsp': 5, 'teaspoon': 5, 'teaspoons': 5,
      'fl oz': 30, 'fluid ounce': 30, 'fluid ounces': 30,
      'pint': 473, 'pints': 473,
      'quart': 946, 'quarts': 946,
      'gallon': 3785, 'gallons': 3785,
      
      // Piece units (estimated weights)
      'piece': 100, 'pieces': 100,
      'item': 100, 'items': 100,
      'small': 80, 'medium': 150, 'large': 200, 'extra large': 250,
      'clove': 3, 'cloves': 3, // for garlic
      'slice': 25, 'slices': 25,
      'fillet': 150, 'fillets': 150,
      'breast': 200, 'breasts': 200,
      'thigh': 120, 'thighs': 120,
      
      // Handfuls and approximate measures
      'handful': 50, 'pinch': 1, 'dash': 2, 'sprinkle': 3,
      'bunch': 100, 'head': 500, // lettuce, cabbage, etc.
      'stalk': 40, 'stalks': 40, // celery
      'sprig': 5, 'sprigs': 5, // herbs
    };

    return numericQuantity * (conversions[normalizedUnit] || 100);
  }

  // Enhanced category detection methods
  private isVegetable(name: string): boolean {
    const vegetables = [
      'vegetable', 'veggie', 'greens', 'leafy', 'cabbage', 'kale', 'celery', 
      'radish', 'turnip', 'beet', 'artichoke', 'asparagus', 'brussels sprouts',
      'eggplant', 'squash', 'pumpkin', 'corn', 'peas', 'beans'
    ];
    return vegetables.some(veg => name.includes(veg)) || name.endsWith('s') && name.length > 4;
  }

  private isFruit(name: string): boolean {
    const fruits = [
      'fruit', 'berry', 'berries', 'grape', 'grapes', 'peach', 'peaches', 
      'pear', 'pears', 'cherry', 'cherries', 'plum', 'plums', 'mango', 
      'mangoes', 'pineapple', 'watermelon', 'cantaloupe', 'honeydew', 'kiwi'
    ];
    return fruits.some(fruit => name.includes(fruit));
  }

  private isProtein(name: string): boolean {
    const proteins = [
      'meat', 'protein', 'turkey', 'duck', 'lamb', 'pork', 'salmon', 'tuna',
      'cod', 'halibut', 'shrimp', 'crab', 'lobster', 'scallops', 'mussels',
      'tempeh', 'seitan'
    ];
    return proteins.some(protein => name.includes(protein));
  }

  private isGrain(name: string): boolean {
    const grains = [
      'grain', 'wheat', 'barley', 'oats', 'flour', 'noodle', 'noodles',
      'cereal', 'crackers', 'couscous', 'bulgur', 'millet', 'amaranth'
    ];
    return grains.some(grain => name.includes(grain));
  }

  private isDairy(name: string): boolean {
    const dairy = [
      'dairy', 'cream', 'sour cream', 'cottage cheese', 'mozzarella', 'parmesan',
      'swiss', 'cheddar', 'goat cheese', 'feta', 'ricotta', 'mascarpone'
    ];
    return dairy.some(item => name.includes(item));
  }

  private isNutOrSeed(name: string): boolean {
    const nutsSeeds = [
      'nut', 'nuts', 'seed', 'seeds', 'cashew', 'cashews', 'pecan', 'pecans',
      'hazelnut', 'hazelnuts', 'pistachio', 'pistachios', 'macadamia',
      'brazil nut', 'pine nut', 'sesame', 'pumpkin seed', 'flax'
    ];
    return nutsSeeds.some(item => name.includes(item));
  }

  private isOil(name: string): boolean {
    const oils = ['oil', 'fat', 'lard', 'shortening', 'ghee'];
    return oils.some(oil => name.includes(oil));
  }

  /**
   * Get detailed nutrition analysis with insights
   */
  getDetailedNutritionAnalysis(nutrition: NutritionInfo): {
    analysis: string[];
    healthScore: number;
    recommendations: string[];
  } {
    const analysis: string[] = [];
    const recommendations: string[] = [];
    let healthScore = 50; // Start with neutral score

    // Calorie analysis
    if (nutrition.calories < 200) {
      analysis.push('Low calorie dish - great for weight management');
      healthScore += 10;
    } else if (nutrition.calories > 600) {
      analysis.push('High calorie dish - consider portion control');
      healthScore -= 5;
      recommendations.push('Consider reducing portion size or adding more vegetables');
    }

    // Protein analysis
    if (nutrition.protein > 15) {
      analysis.push('High protein content - excellent for muscle building');
      healthScore += 15;
    } else if (nutrition.protein < 5) {
      analysis.push('Low protein content');
      recommendations.push('Add protein sources like beans, tofu, or lean meat');
    }

    // Fiber analysis
    if (nutrition.fiber > 5) {
      analysis.push('High fiber content - great for digestive health');
      healthScore += 10;
    } else if (nutrition.fiber < 2) {
      recommendations.push('Add more vegetables or whole grains for fiber');
    }

    // Sugar analysis
    if (nutrition.sugar > 15) {
      analysis.push('High sugar content');
      healthScore -= 5;
      recommendations.push('Consider reducing sweet ingredients');
    }

    // Sodium analysis
    if (nutrition.sodium > 800) {
      analysis.push('High sodium content');
      healthScore -= 10;
      recommendations.push('Reduce salt and use herbs/spices for flavor');
    } else if (nutrition.sodium < 200) {
      analysis.push('Low sodium - heart-healthy option');
      healthScore += 5;
    }

    // Fat analysis
    const fatCalories = nutrition.fat * 9;
    const fatPercentage = (fatCalories / nutrition.calories) * 100;
    
    if (fatPercentage > 35) {
      analysis.push('High fat content');
      healthScore -= 5;
    } else if (fatPercentage < 20) {
      analysis.push('Low fat content');
      healthScore += 5;
    }

    return {
      analysis,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      recommendations
    };
  }

  /**
   * Calculate daily nutrition percentage values with enhanced accuracy
   */
  calculateDailyValues(nutrition: NutritionInfo, age: number = 30, gender: 'male' | 'female' = 'male'): { [key: string]: number } {
    // Adjust daily values based on age and gender
    let dailyValues = {
      calories: gender === 'male' ? 2500 : 2000,
      protein: gender === 'male' ? 56 : 46,
      carbs: 300,
      fat: gender === 'male' ? 78 : 65,
      fiber: 25,
      sodium: 2300
    };

    // Age adjustments
    if (age > 50) {
      dailyValues.calories *= 0.9;
      dailyValues.fiber += 5;
    } else if (age < 25) {
      dailyValues.calories *= 1.1;
    }

    return {
      calories: Math.round((nutrition.calories / dailyValues.calories) * 100),
      protein: Math.round((nutrition.protein / dailyValues.protein) * 100),
      carbs: Math.round((nutrition.carbs / dailyValues.carbs) * 100),
      fat: Math.round((nutrition.fat / dailyValues.fat) * 100),
      fiber: Math.round((nutrition.fiber / dailyValues.fiber) * 100),
      sodium: Math.round((nutrition.sodium / dailyValues.sodium) * 100)
    };
  }

  /**
   * Get all available ingredients with enhanced database
   */
  getAvailableIngredients(): string[] {
    return Object.keys(this.nutritionDB).sort();
  }

  /**
   * Add or update nutrition data
   */
  addCustomNutritionData(ingredientName: string, nutritionData: NutritionData[string]): void {
    this.nutritionDB[ingredientName.toLowerCase().trim()] = { ...nutritionData };
    this.nutritionCache.set(ingredientName.toLowerCase().trim(), nutritionData);
  }

  /**
   * Get nutrition information for a specific ingredient
   */
  async getIngredientNutritionInfo(ingredientName: string): Promise<NutritionInfo | null> {
    const ingredient: Ingredient = {
      id: 'temp',
      name: ingredientName,
      quantity: '100',
      unit: 'g'
    };
    
    try {
      return await this.calculateIngredientNutrition(ingredient);
    } catch (error) {
      console.error('Error getting ingredient nutrition:', error);
      return null;
    }
  }
}

export default new NutritionCalculatorService();
