import axios from 'axios';
import { Recipe, RecipeGenerationRequest, ApiResponse } from '../types';

class AIRecipeService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Support multiple AI providers for better reliability
    this.baseUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    // Try multiple API key sources
    return process.env.OPENAI_API_KEY || 
           process.env.REACT_NATIVE_OPENAI_API_KEY || 
           process.env.AI_API_KEY || 
           '';
  }

  private async tryAlternativeAI(request: RecipeGenerationRequest): Promise<ApiResponse<Recipe>> {
    // Fallback to Hugging Face or other free APIs if OpenAI fails
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: this.buildRecipePrompt(request),
          parameters: {
            max_length: 1000,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const recipe = this.parseAlternativeResponse(data, request);
        return { success: true, data: recipe };
      }
    } catch (error) {
      console.log('Alternative AI also failed:', error);
    }
    
    return this.generateRuleBasedRecipe(request);
  }

  /**
   * Generate recipe using AI based on available ingredients
   */
  async generateRecipe(request: RecipeGenerationRequest): Promise<ApiResponse<Recipe>> {
    try {
      // Check if API key is available
      if (!this.apiKey) {
        console.warn('No API key available, using rule-based generation');
        return this.generateRuleBasedRecipe(request);
      }

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
      
      // Try alternative AI service
      const fallbackResult = await this.tryAlternativeAI(request);
      if (fallbackResult.success) {
        return fallbackResult;
      }
      
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
      // Return a simple fallback recipe
      return {
        id: this.generateId(),
        name: 'Simple Recipe',
        description: 'A simple dish made with your ingredients',
        ingredients: [],
        steps: ['Prepare and cook ingredients as desired'],
        cookingTime: 30,
        servings: 4,
        difficulty: 'Easy',
        cuisine: 'International',
        tags: ['simple'],
        nutrition: {
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
    }
  }

  /**
   * Generate unique ID for recipes
   */
  private generateId(): string {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Parse alternative AI response
   */
  private parseAlternativeResponse(data: any, request: RecipeGenerationRequest): Recipe {
    // Parse response from alternative AI services
    let content = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      content = data[0].generated_text;
    } else {
      return this.generateRuleBasedRecipe(request).data || this.createRecipeFromData({}, request);
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        return this.createRecipeFromData(parsedData, request);
      }
    } catch (error) {
      console.log('Failed to parse alternative AI response');
    }

    return this.generateRuleBasedRecipe(request).data || this.createRecipeFromData({}, request);
  }

  /**
   * Generate recipe using rule-based system when AI fails
   */
  private generateRuleBasedRecipe(request: RecipeGenerationRequest): ApiResponse<Recipe> {
    const { ingredients, mealType = 'Dinner', cookingTime = 30, servings = 4, preferences } = request;
    
    // Categorize ingredients
    const categorizedIngredients = this.categorizeIngredients(ingredients);
    
    // Generate recipe based on ingredient categories
    const recipe = this.createRuleBasedRecipe(categorizedIngredients, {
      mealType,
      cookingTime,
      servings,
      preferences
    });

    return {
      success: true,
      data: recipe,
      message: 'Recipe generated using smart cooking rules'
    };
  }

  /**
   * Categorize ingredients for better recipe generation
   */
  private categorizeIngredients(ingredients: string[]): {
    proteins: string[];
    vegetables: string[];
    grains: string[];
    dairy: string[];
    spices: string[];
    others: string[];
  } {
    const categories = {
      proteins: [] as string[],
      vegetables: [] as string[],
      grains: [] as string[],
      dairy: [] as string[],
      spices: [] as string[],
      others: [] as string[]
    };

    const categoryMappings = {
      proteins: ['chicken', 'beef', 'pork', 'fish', 'egg', 'tofu', 'beans', 'lentils', 'turkey', 'salmon', 'tuna'],
      vegetables: ['tomato', 'onion', 'garlic', 'carrot', 'potato', 'bell pepper', 'spinach', 'broccoli', 'cucumber', 'lettuce', 'mushroom', 'celery', 'zucchini'],
      grains: ['rice', 'pasta', 'bread', 'quinoa', 'oats', 'flour', 'noodles', 'barley'],
      dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt'],
      spices: ['salt', 'pepper', 'basil', 'oregano', 'thyme', 'cumin', 'paprika', 'garlic powder', 'onion powder']
    };

    ingredients.forEach(ingredient => {
      const lowerIngredient = ingredient.toLowerCase();
      let categorized = false;

      for (const [category, items] of Object.entries(categoryMappings)) {
        if (items.some(item => lowerIngredient.includes(item) || item.includes(lowerIngredient))) {
          categories[category as keyof typeof categories].push(ingredient);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories.others.push(ingredient);
      }
    });

    return categories;
  }

  /**
   * Create rule-based recipe from categorized ingredients
   */
  private createRuleBasedRecipe(
    categorizedIngredients: ReturnType<typeof this.categorizeIngredients>, 
    options: {
      mealType: string;
      cookingTime: number;
      servings: number;
      preferences?: any;
    }
  ): Recipe {
    const { proteins, vegetables, grains, dairy, spices, others } = categorizedIngredients;
    const { mealType, cookingTime, servings } = options;

    // Generate recipe name based on main ingredients
    const mainIngredients = [...proteins, ...vegetables, ...grains].slice(0, 3);
    const recipeName = this.generateRecipeName(mainIngredients, mealType);

    // Generate cooking steps based on ingredient categories
    const steps = this.generateCookingSteps(categorizedIngredients, cookingTime);

    // Create ingredients list with estimated quantities
    const recipeIngredients = this.createIngredientsWithQuantities([
      ...proteins, ...vegetables, ...grains, ...dairy, ...spices, ...others
    ], servings);

    // Determine cuisine and tags
    const cuisine = this.determineCuisine(recipeIngredients);
    const tags = this.generateTags(categorizedIngredients, mealType);

    const recipe: Recipe = {
      id: this.generateId(),
      name: recipeName,
      description: `A delicious ${mealType.toLowerCase()} made with ${mainIngredients.join(', ')}`,
      ingredients: recipeIngredients,
      steps,
      cookingTime,
      servings,
      difficulty: this.calculateDifficulty(steps.length, cookingTime, recipeIngredients.length),
      cuisine,
      tags,
      nutrition: {
        calories: 0, // Will be calculated by nutrition service
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
  }

  /**
   * Generate recipe name based on main ingredients
   */
  private generateRecipeName(ingredients: string[], mealType: string): string {
    if (ingredients.length === 0) return `Mixed ${mealType}`;
    
    const namePatterns = [
      `${ingredients.join(' and ')} ${mealType}`,
      `${ingredients[0]} with ${ingredients.slice(1).join(' and ')}`,
      `${ingredients.join('-')} Delight`,
      `Homestyle ${ingredients.join(' ')} Bowl`
    ];

    return namePatterns[Math.floor(Math.random() * namePatterns.length)];
  }

  /**
   * Generate cooking steps based on ingredients
   */
  private generateCookingSteps(
    categorizedIngredients: ReturnType<typeof this.categorizeIngredients>,
    cookingTime: number
  ): string[] {
    const { proteins, vegetables, grains, dairy, spices } = categorizedIngredients;
    const steps: string[] = [];

    // Prep step
    steps.push('Wash and prepare all ingredients. Chop vegetables and measure out spices.');

    // Protein cooking
    if (proteins.length > 0) {
      if (proteins.some(p => ['chicken', 'beef', 'pork'].some(meat => p.toLowerCase().includes(meat)))) {
        steps.push(`Heat oil in a large pan over medium-high heat. Cook ${proteins.join(' and ')} until browned and cooked through, about ${Math.min(cookingTime * 0.4, 15)} minutes.`);
      } else if (proteins.some(p => p.toLowerCase().includes('egg'))) {
        steps.push('Beat eggs in a bowl and set aside for later use.');
      }
    }

    // Vegetable cooking
    if (vegetables.length > 0) {
      const hardVeggies = vegetables.filter(v => ['carrot', 'potato', 'onion'].some(hv => v.toLowerCase().includes(hv)));
      const softVeggies = vegetables.filter(v => !hardVeggies.includes(v));

      if (hardVeggies.length > 0) {
        steps.push(`Add ${hardVeggies.join(' and ')} to the pan and cook for ${Math.min(cookingTime * 0.3, 10)} minutes until softened.`);
      }
      if (softVeggies.length > 0) {
        steps.push(`Add ${softVeggies.join(' and ')} and cook for another ${Math.min(cookingTime * 0.2, 5)} minutes.`);
      }
    }

    // Grains/starches
    if (grains.length > 0) {
      if (grains.some(g => g.toLowerCase().includes('rice'))) {
        steps.push('Add rice with appropriate amount of water or broth. Cover and simmer until tender.');
      } else if (grains.some(g => g.toLowerCase().includes('pasta'))) {
        steps.push('Cook pasta according to package directions. Drain and add to the pan.');
      }
    }

    // Seasoning
    if (spices.length > 0) {
      steps.push(`Season with ${spices.join(', ')} to taste.`);
    }

    // Final step
    steps.push('Stir everything together and cook for a few more minutes until heated through. Taste and adjust seasoning as needed.');
    steps.push('Serve hot and enjoy!');

    return steps;
  }

  /**
   * Create ingredients with estimated quantities
   */
  private createIngredientsWithQuantities(ingredients: string[], servings: number): any[] {
    return ingredients.map((ingredient, index) => {
      let quantity = '1';
      let unit = 'piece';

      // Estimate quantities based on ingredient type
      const lowerIngredient = ingredient.toLowerCase();
      
      if (['salt', 'pepper'].some(s => lowerIngredient.includes(s))) {
        quantity = '1';
        unit = 'tsp';
      } else if (['garlic', 'ginger'].some(s => lowerIngredient.includes(s))) {
        quantity = '2';
        unit = 'cloves';
      } else if (['onion', 'tomato', 'potato'].some(s => lowerIngredient.includes(s))) {
        quantity = Math.ceil(servings / 2).toString();
        unit = 'medium';
      } else if (['rice', 'pasta'].some(s => lowerIngredient.includes(s))) {
        quantity = Math.ceil(servings / 4).toString();
        unit = 'cup';
      } else if (['oil', 'butter'].some(s => lowerIngredient.includes(s))) {
        quantity = '2';
        unit = 'tbsp';
      } else {
        quantity = Math.ceil(servings / 2).toString();
        unit = 'piece';
      }

      return {
        id: `ing_${index}`,
        name: ingredient,
        quantity,
        unit,
        category: ''
      };
    });
  }

  /**
   * Determine cuisine based on ingredients
   */
  private determineCuisine(ingredients: any[]): string {
    const ingredientNames = ingredients.map(ing => ing.name.toLowerCase()).join(' ');
    
    if (['soy sauce', 'ginger', 'rice'].some(asian => ingredientNames.includes(asian))) {
      return 'Asian';
    } else if (['pasta', 'tomato', 'basil'].some(italian => ingredientNames.includes(italian))) {
      return 'Italian';
    } else if (['cumin', 'coriander', 'turmeric'].some(indian => ingredientNames.includes(indian))) {
      return 'Indian';
    } else if (['lime', 'cilantro', 'chili'].some(mexican => ingredientNames.includes(mexican))) {
      return 'Mexican';
    }
    
    return 'International';
  }

  /**
   * Generate tags based on ingredients and meal type
   */
  private generateTags(
    categorizedIngredients: ReturnType<typeof this.categorizeIngredients>,
    mealType: string
  ): string[] {
    const tags: string[] = [mealType.toLowerCase()];
    
    if (categorizedIngredients.proteins.length === 0) {
      tags.push('vegetarian');
    }
    
    if (categorizedIngredients.dairy.length === 0 && categorizedIngredients.proteins.length === 0) {
      tags.push('vegan');
    }
    
    if (categorizedIngredients.vegetables.length > categorizedIngredients.proteins.length) {
      tags.push('healthy');
    }
    
    tags.push('homemade', 'easy');
    
    return tags;
  }

  /**
   * Calculate recipe difficulty
   */
  private calculateDifficulty(stepCount: number, cookingTime: number, ingredientCount: number): 'Easy' | 'Medium' | 'Hard' {
    const score = (stepCount * 0.3) + (cookingTime * 0.01) + (ingredientCount * 0.1);
    
    if (score < 3) return 'Easy';
    if (score < 6) return 'Medium';
    return 'Hard';
  }

  /**
   * Create recipe from parsed data with fallbacks
   */
  private createRecipeFromData(parsedData: any, request: RecipeGenerationRequest): Recipe {
    const { ingredients: requestIngredients, mealType = 'Dinner', cookingTime = 30, servings = 4 } = request;
    
    return {
      id: this.generateId(),
      name: parsedData.name || this.generateRecipeName(requestIngredients.slice(0, 3), mealType),
      description: parsedData.description || `A delicious ${mealType.toLowerCase()} recipe`,
      ingredients: parsedData.ingredients?.map((ing: any, index: number) => ({
        id: `ing_${index}`,
        name: ing.name || ing,
        quantity: ing.quantity || '1',
        unit: ing.unit || 'piece',
        category: ''
      })) || [],
      steps: parsedData.steps || ['Prepare ingredients and cook as desired'],
      cookingTime: parsedData.cookingTime || cookingTime,
      servings: parsedData.servings || servings,
      difficulty: parsedData.difficulty || 'Medium',
      cuisine: parsedData.cuisine || 'International',
      tags: parsedData.tags || ['homemade'],
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
  }
}

export default new AIRecipeService();
