import { Recipe, Ingredient } from '../types';

/**
 * Format cooking time into readable string
 */
export const formatCookingTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};

/**
 * Format ingredient quantity and unit
 */
export const formatIngredientQuantity = (ingredient: Ingredient): string => {
  if (!ingredient.quantity) {
    return ingredient.name;
  }
  
  if (!ingredient.unit) {
    return `${ingredient.quantity} ${ingredient.name}`;
  }
  
  return `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`;
};

/**
 * Generate a slug from recipe name for URLs or IDs
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Calculate recipe difficulty based on various factors
 */
export const calculateRecipeDifficulty = (recipe: Recipe): 'Easy' | 'Medium' | 'Hard' => {
  let score = 0;
  
  // Factor in number of ingredients
  if (recipe.ingredients.length > 10) score += 2;
  else if (recipe.ingredients.length > 5) score += 1;
  
  // Factor in number of steps
  if (recipe.steps.length > 8) score += 2;
  else if (recipe.steps.length > 4) score += 1;
  
  // Factor in cooking time
  if (recipe.cookingTime > 120) score += 2;
  else if (recipe.cookingTime > 60) score += 1;
  
  // Factor in complexity keywords in steps
  const complexKeywords = ['marinate', 'ferment', 'proof', 'sous vide', 'flambé', 'julienne', 'brunoise'];
  const hasComplexTechniques = recipe.steps.some(step => 
    complexKeywords.some(keyword => step.toLowerCase().includes(keyword))
  );
  
  if (hasComplexTechniques) score += 2;
  
  if (score >= 4) return 'Hard';
  if (score >= 2) return 'Medium';
  return 'Easy';
};

/**
 * Validate recipe data completeness
 */
export const validateRecipe = (recipe: Partial<Recipe>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!recipe.name || recipe.name.trim().length === 0) {
    errors.push('Recipe name is required');
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push('At least one ingredient is required');
  }
  
  if (!recipe.steps || recipe.steps.length === 0) {
    errors.push('At least one cooking step is required');
  }
  
  if (!recipe.cookingTime || recipe.cookingTime <= 0) {
    errors.push('Valid cooking time is required');
  }
  
  if (!recipe.servings || recipe.servings <= 0) {
    errors.push('Valid serving size is required');
  }
  
  // Validate ingredients have names
  if (recipe.ingredients) {
    recipe.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name || ingredient.name.trim().length === 0) {
        errors.push(`Ingredient ${index + 1} must have a name`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Clean and normalize ingredient names
 */
export const normalizeIngredientName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Extract unique ingredients from multiple recipes
 */
export const extractUniqueIngredients = (recipes: Recipe[]): string[] => {
  const ingredientSet = new Set<string>();
  
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ingredient => {
      ingredientSet.add(normalizeIngredientName(ingredient.name));
    });
  });
  
  return Array.from(ingredientSet).sort();
};

/**
 * Filter recipes by dietary restrictions
 */
export const filterRecipesByDiet = (recipes: Recipe[], restrictions: string[]): Recipe[] => {
  if (!restrictions || restrictions.length === 0) {
    return recipes;
  }
  
  return recipes.filter(recipe => {
    return restrictions.every(restriction => {
      switch (restriction.toLowerCase()) {
        case 'vegetarian':
          return !recipe.ingredients.some(ing => 
            ['chicken', 'beef', 'pork', 'fish', 'meat'].some(meat => 
              ing.name.toLowerCase().includes(meat)
            )
          );
        case 'vegan':
          return !recipe.ingredients.some(ing => 
            ['chicken', 'beef', 'pork', 'fish', 'meat', 'milk', 'cheese', 'egg', 'butter', 'cream'].some(animal => 
              ing.name.toLowerCase().includes(animal)
            )
          );
        case 'gluten-free':
          return !recipe.ingredients.some(ing => 
            ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye'].some(gluten => 
              ing.name.toLowerCase().includes(gluten)
            )
          );
        case 'dairy-free':
          return !recipe.ingredients.some(ing => 
            ['milk', 'cheese', 'butter', 'cream', 'yogurt'].some(dairy => 
              ing.name.toLowerCase().includes(dairy)
            )
          );
        default:
          return true;
      }
    });
  });
};

/**
 * Search recipes by query string
 */
export const searchRecipes = (recipes: Recipe[], query: string): Recipe[] => {
  if (!query || query.trim().length === 0) {
    return recipes;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return recipes.filter(recipe => {
    // Search in recipe name
    if (recipe.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in description
    if (recipe.description && recipe.description.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in ingredients
    if (recipe.ingredients.some(ing => ing.name.toLowerCase().includes(normalizedQuery))) {
      return true;
    }
    
    // Search in tags
    if (recipe.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
      return true;
    }
    
    // Search in cuisine
    if (recipe.cuisine && recipe.cuisine.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    return false;
  });
};

/**
 * Sort recipes by various criteria
 */
export const sortRecipes = (recipes: Recipe[], sortBy: 'name' | 'cookingTime' | 'rating' | 'date'): Recipe[] => {
  return [...recipes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'cookingTime':
        return a.cookingTime - b.cookingTime;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });
};

/**
 * Calculate recipe similarity based on ingredients
 */
export const calculateRecipeSimilarity = (recipe1: Recipe, recipe2: Recipe): number => {
  const ingredients1 = recipe1.ingredients.map(ing => normalizeIngredientName(ing.name));
  const ingredients2 = recipe2.ingredients.map(ing => normalizeIngredientName(ing.name));
  
  const commonIngredients = ingredients1.filter(ing => ingredients2.includes(ing));
  const totalUniqueIngredients = new Set([...ingredients1, ...ingredients2]).size;
  
  return commonIngredients.length / totalUniqueIngredients;
};

/**
 * Get recommended recipes based on a target recipe
 */
export const getRecommendedRecipes = (targetRecipe: Recipe, allRecipes: Recipe[], limit: number = 5): Recipe[] => {
  const similarities = allRecipes
    .filter(recipe => recipe.id !== targetRecipe.id)
    .map(recipe => ({
      recipe,
      similarity: calculateRecipeSimilarity(targetRecipe, recipe)
    }))
    .sort((a, b) => b.similarity - a.similarity);
  
  return similarities.slice(0, limit).map(item => item.recipe);
};

/**
 * Convert recipe to shareable text format
 */
export const recipeToText = (recipe: Recipe): string => {
  let text = `${recipe.name}\n`;
  text += `${'='.repeat(recipe.name.length)}\n\n`;
  
  if (recipe.description) {
    text += `${recipe.description}\n\n`;
  }
  
  text += `⏱️ Cooking Time: ${formatCookingTime(recipe.cookingTime)}\n`;
  text += `👥 Servings: ${recipe.servings}\n`;
  text += `📊 Difficulty: ${recipe.difficulty}\n`;
  
  if (recipe.cuisine) {
    text += `🌍 Cuisine: ${recipe.cuisine}\n`;
  }
  
  text += '\n📝 INGREDIENTS:\n';
  text += '-'.repeat(15) + '\n';
  recipe.ingredients.forEach((ingredient, index) => {
    text += `${index + 1}. ${formatIngredientQuantity(ingredient)}\n`;
  });
  
  text += '\n👨‍🍳 INSTRUCTIONS:\n';
  text += '-'.repeat(18) + '\n';
  recipe.steps.forEach((step, index) => {
    text += `${index + 1}. ${step}\n`;
  });
  
  if (recipe.nutrition) {
    text += '\n📊 NUTRITION (per serving):\n';
    text += '-'.repeat(28) + '\n';
    text += `Calories: ${recipe.nutrition.calories}\n`;
    text += `Protein: ${recipe.nutrition.protein}g\n`;
    text += `Carbs: ${recipe.nutrition.carbs}g\n`;
    text += `Fat: ${recipe.nutrition.fat}g\n`;
    text += `Fiber: ${recipe.nutrition.fiber}g\n`;
  }
  
  if (recipe.tags.length > 0) {
    text += `\n🏷️ Tags: ${recipe.tags.join(', ')}\n`;
  }
  
  text += '\n---\n';
  text += 'Generated with Recipe Generator App\n';
  
  return text;
};

/**
 * Debounce function for search and other rapid inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Generate random recipe ID
 */
export const generateRecipeId = (): string => {
  return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if recipe contains allergens
 */
export const checkAllergens = (recipe: Recipe, allergens: string[]): string[] => {
  const foundAllergens: string[] = [];
  
  allergens.forEach(allergen => {
    const normalizedAllergen = allergen.toLowerCase();
    
    const hasAllergen = recipe.ingredients.some(ingredient => 
      ingredient.name.toLowerCase().includes(normalizedAllergen)
    );
    
    if (hasAllergen) {
      foundAllergens.push(allergen);
    }
  });
  
  return foundAllergens;
};
