import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, User, UserPreferences } from '../types';

class DatabaseService {
  private readonly RECIPES_KEY = 'saved_recipes';
  private readonly USER_KEY = 'user_data';
  private readonly PREFERENCES_KEY = 'user_preferences';
  private readonly RECIPE_HISTORY_KEY = 'recipe_history';

  /**
   * Save a recipe to local storage
   */
  async saveRecipe(recipe: Recipe): Promise<boolean> {
    try {
      const existingRecipes = await this.getAllRecipes();
      const updatedRecipes = [...existingRecipes, recipe];
      
      await AsyncStorage.setItem(this.RECIPES_KEY, JSON.stringify(updatedRecipes));
      return true;
    } catch (error) {
      console.error('Error saving recipe:', error);
      return false;
    }
  }

  /**
   * Get all saved recipes
   */
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const recipesJson = await AsyncStorage.getItem(this.RECIPES_KEY);
      return recipesJson ? JSON.parse(recipesJson) : [];
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  }

  /**
   * Get recipe by ID
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const recipes = await this.getAllRecipes();
      return recipes.find(recipe => recipe.id === id) || null;
    } catch (error) {
      console.error('Error getting recipe by ID:', error);
      return null;
    }
  }

  /**
   * Update an existing recipe
   */
  async updateRecipe(updatedRecipe: Recipe): Promise<boolean> {
    try {
      const recipes = await this.getAllRecipes();
      const recipeIndex = recipes.findIndex(recipe => recipe.id === updatedRecipe.id);
      
      if (recipeIndex !== -1) {
        recipes[recipeIndex] = updatedRecipe;
        await AsyncStorage.setItem(this.RECIPES_KEY, JSON.stringify(recipes));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating recipe:', error);
      return false;
    }
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(recipeId: string): Promise<boolean> {
    try {
      const recipes = await this.getAllRecipes();
      const filteredRecipes = recipes.filter(recipe => recipe.id !== recipeId);
      
      await AsyncStorage.setItem(this.RECIPES_KEY, JSON.stringify(filteredRecipes));
      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
  }

  /**
   * Search recipes by ingredients
   */
  async searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
    try {
      const recipes = await this.getAllRecipes();
      const normalizedSearchIngredients = ingredients.map(ing => ing.toLowerCase());
      
      return recipes.filter(recipe => {
        const recipeIngredients = recipe.ingredients.map(ing => ing.name.toLowerCase());
        return normalizedSearchIngredients.some(searchIng => 
          recipeIngredients.some(recipeIng => recipeIng.includes(searchIng))
        );
      });
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }

  /**
   * Search recipes by name or tags
   */
  async searchRecipes(query: string): Promise<Recipe[]> {
    try {
      const recipes = await this.getAllRecipes();
      const normalizedQuery = query.toLowerCase();
      
      return recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(normalizedQuery) ||
        recipe.description?.toLowerCase().includes(normalizedQuery) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
        recipe.cuisine?.toLowerCase().includes(normalizedQuery)
      );
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }

  /**
   * Get recipes by difficulty
   */
  async getRecipesByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<Recipe[]> {
    try {
      const recipes = await this.getAllRecipes();
      return recipes.filter(recipe => recipe.difficulty === difficulty);
    } catch (error) {
      console.error('Error filtering recipes by difficulty:', error);
      return [];
    }
  }

  /**
   * Get recipes by cooking time
   */
  async getRecipesByCookingTime(maxTime: number): Promise<Recipe[]> {
    try {
      const recipes = await this.getAllRecipes();
      return recipes.filter(recipe => recipe.cookingTime <= maxTime);
    } catch (error) {
      console.error('Error filtering recipes by cooking time:', error);
      return [];
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const preferencesJson = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Save user data
   */
  async saveUser(user: User): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  }

  /**
   * Get user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Add recipe to user's recipe history
   */
  async addToRecipeHistory(recipeId: string): Promise<boolean> {
    try {
      const historyJson = await AsyncStorage.getItem(this.RECIPE_HISTORY_KEY);
      const history: string[] = historyJson ? JSON.parse(historyJson) : [];
      
      // Remove if already exists to avoid duplicates
      const filteredHistory = history.filter(id => id !== recipeId);
      
      // Add to beginning of array (most recent first)
      const updatedHistory = [recipeId, ...filteredHistory].slice(0, 50); // Keep only last 50
      
      await AsyncStorage.setItem(this.RECIPE_HISTORY_KEY, JSON.stringify(updatedHistory));
      return true;
    } catch (error) {
      console.error('Error adding to recipe history:', error);
      return false;
    }
  }

  /**
   * Get recipe history
   */
  async getRecipeHistory(): Promise<Recipe[]> {
    try {
      const historyJson = await AsyncStorage.getItem(this.RECIPE_HISTORY_KEY);
      const historyIds: string[] = historyJson ? JSON.parse(historyJson) : [];
      
      const recipes = await this.getAllRecipes();
      
      return historyIds
        .map(id => recipes.find(recipe => recipe.id === id))
        .filter(recipe => recipe !== undefined) as Recipe[];
    } catch (error) {
      console.error('Error getting recipe history:', error);
      return [];
    }
  }

  /**
   * Get favorite recipes (highly rated ones)
   */
  async getFavoriteRecipes(): Promise<Recipe[]> {
    try {
      const recipes = await this.getAllRecipes();
      return recipes.filter(recipe => recipe.rating && recipe.rating >= 4);
    } catch (error) {
      console.error('Error getting favorite recipes:', error);
      return [];
    }
  }

  /**
   * Rate a recipe
   */
  async rateRecipe(recipeId: string, rating: number): Promise<boolean> {
    try {
      const recipe = await this.getRecipeById(recipeId);
      if (recipe) {
        recipe.rating = rating;
        return await this.updateRecipe(recipe);
      }
      return false;
    } catch (error) {
      console.error('Error rating recipe:', error);
      return false;
    }
  }

  /**
   * Clear all data (for logout/reset)
   */
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        this.RECIPES_KEY,
        this.USER_KEY,
        this.PREFERENCES_KEY,
        this.RECIPE_HISTORY_KEY
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Get statistics about user's recipes
   */
  async getRecipeStats(): Promise<{
    totalRecipes: number;
    averageCookingTime: number;
    mostUsedCuisine: string;
    favoriteCount: number;
  }> {
    try {
      const recipes = await this.getAllRecipes();
      
      const totalRecipes = recipes.length;
      const averageCookingTime = recipes.length > 0 
        ? recipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0) / recipes.length
        : 0;
      
      // Find most used cuisine
      const cuisineCounts: { [key: string]: number } = {};
      recipes.forEach(recipe => {
        if (recipe.cuisine) {
          cuisineCounts[recipe.cuisine] = (cuisineCounts[recipe.cuisine] || 0) + 1;
        }
      });
      
      const mostUsedCuisine = Object.keys(cuisineCounts).reduce((a, b) => 
        cuisineCounts[a] > cuisineCounts[b] ? a : b, ''
      );
      
      const favoriteCount = recipes.filter(recipe => recipe.rating && recipe.rating >= 4).length;
      
      return {
        totalRecipes,
        averageCookingTime: Math.round(averageCookingTime),
        mostUsedCuisine,
        favoriteCount
      };
    } catch (error) {
      console.error('Error getting recipe stats:', error);
      return {
        totalRecipes: 0,
        averageCookingTime: 0,
        mostUsedCuisine: '',
        favoriteCount: 0
      };
    }
  }
}

export default new DatabaseService();
