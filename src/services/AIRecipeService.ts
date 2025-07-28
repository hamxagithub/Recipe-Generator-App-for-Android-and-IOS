import axios from 'axios';
import { Recipe, RecipeGenerationRequest, ApiResponse } from '../types';

class AIRecipeService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // You can replace this with your preferred AI service (OpenAI, Hugging Face, etc.)
    this.baseUrl = 'https://api.openai.com/v1';
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Generate recipe using AI based on available ingredients
   */
  async generateRecipe(request: RecipeGenerationRequest): Promise<ApiResponse<Recipe>> {
    try {
      const prompt = this.buildRecipePrompt(request);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional chef and recipe creator. Generate detailed, practical recipes based on available ingredients. Always return valid JSON format with the exact structure requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      const recipe = this.parseRecipeResponse(aiResponse);
      
      return {
        success: true,
        data: recipe
      };
    } catch (error) {
      console.error('AI Recipe Generation Error:', error);
      return {
        success: false,
        error: 'Failed to generate recipe. Please try again.'
      };
    }
  }

  /**
   * Build prompt for AI recipe generation
   */
  private buildRecipePrompt(request: RecipeGenerationRequest): string {
    const { ingredients, preferences, excludeIngredients, mealType, cookingTime, servings } = request;
    
    let prompt = `Generate a detailed recipe using these ingredients: ${ingredients.join(', ')}.\n\n`;
    
    if (mealType) {
      prompt += `Meal type: ${mealType}\n`;
    }
    
    if (cookingTime) {
      prompt += `Maximum cooking time: ${cookingTime} minutes\n`;
    }
    
    if (servings) {
      prompt += `Servings: ${servings}\n`;
    }
    
    if (preferences?.dietaryRestrictions?.length) {
      prompt += `Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}\n`;
    }
    
    if (preferences?.allergies?.length) {
      prompt += `Allergies to avoid: ${preferences.allergies.join(', ')}\n`;
    }
    
    if (excludeIngredients?.length) {
      prompt += `Do not use these ingredients: ${excludeIngredients.join(', ')}\n`;
    }
    
    prompt += `\nPlease return the response as a valid JSON object with this exact structure:
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": [
        {
          "name": "ingredient name",
          "quantity": "amount",
          "unit": "measurement unit"
        }
      ],
      "steps": ["step 1", "step 2", "step 3"],
      "cookingTime": 30,
      "servings": 4,
      "difficulty": "Easy",
      "cuisine": "cuisine type",
      "tags": ["tag1", "tag2"],
      "nutrition": {
        "calories": 350,
        "protein": 25,
        "carbs": 30,
        "fat": 15,
        "fiber": 5,
        "sugar": 8,
        "sodium": 500
      }
    }`;
    
    return prompt;
  }

  /**
   * Parse AI response and convert to Recipe object
   */
  private parseRecipeResponse(response: string): Recipe {
    try {
      // Extract JSON from response if it's wrapped in markdown or other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      const parsedData = JSON.parse(jsonString);
      
      // Create a proper Recipe object with required fields
      const recipe: Recipe = {
        id: this.generateId(),
        name: parsedData.name || 'Generated Recipe',
        description: parsedData.description || '',
        ingredients: parsedData.ingredients?.map((ing: any, index: number) => ({
          id: `ing_${index}`,
          name: ing.name || ing,
          quantity: ing.quantity || '',
          unit: ing.unit || '',
          category: ''
        })) || [],
        steps: parsedData.steps || [],
        cookingTime: parsedData.cookingTime || 30,
        servings: parsedData.servings || 4,
        difficulty: parsedData.difficulty || 'Medium',
        cuisine: parsedData.cuisine || '',
        tags: parsedData.tags || [],
        nutrition: parsedData.nutrition || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0
        },
        createdAt: new Date()
      };
      
      return recipe;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return a fallback recipe
      return this.getFallbackRecipe();
    }
  }

  /**
   * Generate unique ID for recipes
   */
  private generateId(): string {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Fallback recipe when AI parsing fails
   */
  private getFallbackRecipe(): Recipe {
    return {
      id: this.generateId(),
      name: 'Simple Mixed Ingredients Dish',
      description: 'A simple dish made with your available ingredients',
      ingredients: [],
      steps: [
        'Prepare all ingredients by washing and chopping as needed',
        'Heat oil in a pan over medium heat',
        'Add ingredients and cook until tender',
        'Season with salt and pepper to taste',
        'Serve hot'
      ],
      cookingTime: 20,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Fusion',
      tags: ['quick', 'easy'],
      nutrition: {
        calories: 200,
        protein: 10,
        carbs: 15,
        fat: 8,
        fiber: 3,
        sugar: 5,
        sodium: 300
      },
      createdAt: new Date()
    };
  }
}

export default new AIRecipeService();
