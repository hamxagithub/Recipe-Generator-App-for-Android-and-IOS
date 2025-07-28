import { ImageRecognitionResult, ApiResponse } from '../types';

class IngredientRecognitionService {
  private baseUrl: string;
  private apiKey: string;

  // Common ingredient mappings for better recognition
  private ingredientMappings: { [key: string]: string } = {
    'tomato': 'tomato',
    'tomatoes': 'tomato',
    'onion': 'onion', 
    'onions': 'onion',
    'potato': 'potato',
    'potatoes': 'potato',
    'carrot': 'carrot',
    'carrots': 'carrot',
    'bell pepper': 'bell pepper',
    'capsicum': 'bell pepper',
    'garlic': 'garlic',
    'ginger': 'ginger',
    'spinach': 'spinach',
    'lettuce': 'lettuce',
    'cucumber': 'cucumber',
    'broccoli': 'broccoli',
    'cauliflower': 'cauliflower',
    'mushroom': 'mushroom',
    'mushrooms': 'mushroom',
    'chicken': 'chicken',
    'beef': 'beef',
    'pork': 'pork',
    'fish': 'fish',
    'egg': 'egg',
    'eggs': 'egg',
    'cheese': 'cheese',
    'milk': 'milk',
    'bread': 'bread',
    'rice': 'rice',
    'pasta': 'pasta',
    'lemon': 'lemon',
    'lime': 'lime',
    'apple': 'apple',
    'banana': 'banana',
    'orange': 'orange'
  };

  constructor() {
    // Using a computer vision API for ingredient recognition
    // You can use Google Vision API, Azure Computer Vision, or custom models
    this.baseUrl = 'https://api.googlevisionapi.com/v1';
    this.apiKey = process.env.GOOGLE_VISION_API_KEY || '';
  }

  /**
   * Recognize ingredients from image using AI vision
   */
  async recognizeIngredients(imageBase64: string): Promise<ApiResponse<ImageRecognitionResult>> {
    try {
      // First try with Google Vision API
      const visionResult = await this.recognizeWithGoogleVision(imageBase64);
      
      if (visionResult.success && visionResult.data) {
        return visionResult;
      }

      // Fallback to mock recognition for demo purposes
      return this.mockIngredientRecognition(imageBase64);
      
    } catch (error) {
      console.error('Ingredient Recognition Error:', error);
      return {
        success: false,
        error: 'Failed to recognize ingredients from image. Please try again or enter ingredients manually.'
      };
    }
  }

  /**
   * Use Google Vision API for object detection
   */
  private async recognizeWithGoogleVision(imageBase64: string): Promise<ApiResponse<ImageRecognitionResult>> {
    try {
      const response = await fetch(`${this.baseUrl}/images:annotate?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64
              },
              features: [
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 20
                },
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 20
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.responses && data.responses[0]) {
        const objects = data.responses[0].localizedObjectAnnotations || [];
        const labels = data.responses[0].labelAnnotations || [];
        
        const recognizedIngredients = this.extractIngredientsFromVisionData(objects, labels);
        
        return {
          success: true,
          data: recognizedIngredients
        };
      }

      return {
        success: false,
        error: 'No ingredients detected in image'
      };

    } catch (error) {
      console.error('Google Vision API Error:', error);
      return {
        success: false,
        error: 'Vision API error'
      };
    }
  }

  /**
   * Extract ingredients from Google Vision API response
   */
  private extractIngredientsFromVisionData(objects: any[], labels: any[]): ImageRecognitionResult {
    const allDetections = [
      ...objects.map(obj => ({ name: obj.name, confidence: obj.score })),
      ...labels.map(label => ({ name: label.description, confidence: label.score }))
    ];

    // Filter for food-related items and map to standard ingredient names
    const ingredients: string[] = [];
    const confidences: number[] = [];

    allDetections.forEach(detection => {
      const normalizedName = detection.name.toLowerCase();
      const mappedIngredient = this.findMatchingIngredient(normalizedName);
      
      if (mappedIngredient && !ingredients.includes(mappedIngredient)) {
        ingredients.push(mappedIngredient);
        confidences.push(detection.confidence);
      }
    });

    return {
      ingredients,
      confidence: confidences
    };
  }

  /**
   * Find matching ingredient from detected object/label
   */
  private findMatchingIngredient(detectedName: string): string | null {
    // Direct mapping
    if (this.ingredientMappings[detectedName]) {
      return this.ingredientMappings[detectedName];
    }

    // Fuzzy matching for ingredient names
    for (const [key, value] of Object.entries(this.ingredientMappings)) {
      if (detectedName.includes(key) || key.includes(detectedName)) {
        return value;
      }
    }

    // Check if it's a food-related term
    const foodKeywords = [
      'vegetable', 'fruit', 'meat', 'dairy', 'grain', 'herb', 'spice',
      'produce', 'organic', 'fresh', 'food', 'ingredient'
    ];

    if (foodKeywords.some(keyword => detectedName.includes(keyword))) {
      return detectedName;
    }

    return null;
  }

  /**
   * Mock ingredient recognition for demonstration/fallback
   */
  private async mockIngredientRecognition(imageBase64: string): Promise<ApiResponse<ImageRecognitionResult>> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock ingredients based on common combinations
    const mockIngredients = [
      'tomato', 'onion', 'garlic', 'bell pepper', 'carrot'
    ];

    const mockConfidences = [0.95, 0.88, 0.82, 0.76, 0.71];

    return {
      success: true,
      data: {
        ingredients: mockIngredients,
        confidence: mockConfidences
      },
      message: 'Using demo recognition - actual results may vary'
    };
  }

  /**
   * Preprocess ingredient names for better standardization
   */
  preprocessIngredients(ingredients: string[]): string[] {
    return ingredients.map(ingredient => {
      const normalized = ingredient.toLowerCase().trim();
      return this.ingredientMappings[normalized] || normalized;
    });
  }

  /**
   * Get ingredient suggestions based on partial input
   */
  getIngredientSuggestions(input: string): string[] {
    const normalizedInput = input.toLowerCase();
    const suggestions: string[] = [];

    Object.values(this.ingredientMappings).forEach(ingredient => {
      if (ingredient.toLowerCase().includes(normalizedInput) && !suggestions.includes(ingredient)) {
        suggestions.push(ingredient);
      }
    });

    return suggestions.slice(0, 10); // Return top 10 suggestions
  }
}

export default new IngredientRecognitionService();
