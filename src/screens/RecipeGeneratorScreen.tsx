import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { Recipe, RecipeGenerationRequest, UserPreferences } from '../types';
import { RecipeGeneratorScreenProps } from '../types/navigation';
import AIRecipeService from '../services/AIRecipeService';
import IngredientRecognitionService from '../services/IngredientRecognitionService';
import DatabaseService from '../services/DatabaseService';
import NutritionCalculatorService from '../services/NutritionCalculatorService';

const RecipeGeneratorScreen = ({ navigation }: RecipeGeneratorScreenProps) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
  const [currentExclude, setCurrentExclude] = useState('');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'>('Dinner');
  const [cookingTime, setCookingTime] = useState('30');
  const [servings, setServings] = useState('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (currentIngredient.length > 2) {
      const newSuggestions = IngredientRecognitionService.getIngredientSuggestions(currentIngredient);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [currentIngredient]);

  const loadUserPreferences = async () => {
    try {
      const preferences = await DatabaseService.getUserPreferences();
      setUserPreferences(preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const addIngredient = (ingredient: string = currentIngredient) => {
    const normalizedIngredient = ingredient.trim().toLowerCase();
    if (normalizedIngredient && !ingredients.includes(normalizedIngredient)) {
      setIngredients([...ingredients, normalizedIngredient]);
      setCurrentIngredient('');
      setSuggestions([]);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addExcludeIngredient = () => {
    const normalizedIngredient = currentExclude.trim().toLowerCase();
    if (normalizedIngredient && !excludeIngredients.includes(normalizedIngredient)) {
      setExcludeIngredients([...excludeIngredients, normalizedIngredient]);
      setCurrentExclude('');
    }
  };

  const removeExcludeIngredient = (index: number) => {
    setExcludeIngredients(excludeIngredients.filter((_, i) => i !== index));
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      includeBase64: true,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0] && response.assets[0].base64) {
        processImage(response.assets[0].base64);
      }
    });
  };

  const processImage = async (base64: string) => {
    try {
      setIsImageProcessing(true);
      const result = await IngredientRecognitionService.recognizeIngredients(base64);
      
      if (result.success && result.data) {
        const recognizedIngredients = result.data.ingredients;
        const newIngredients = recognizedIngredients.filter(
          ingredient => !ingredients.includes(ingredient.toLowerCase())
        );
        
        if (newIngredients.length > 0) {
          setIngredients([...ingredients, ...newIngredients.map(ing => ing.toLowerCase())]);
          Alert.alert(
            'Ingredients Detected!',
            `Found: ${newIngredients.join(', ')}${result.message ? '\n\n' + result.message : ''}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('No New Ingredients', 'All detected ingredients are already in your list.');
        }
      } else {
        Alert.alert('Recognition Failed', result.error || 'Could not recognize ingredients from image.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsImageProcessing(false);
    }
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      Alert.alert('Missing Ingredients', 'Please add at least one ingredient to generate a recipe.');
      return;
    }

    try {
      setIsGenerating(true);

      const request: RecipeGenerationRequest = {
        ingredients,
        preferences: userPreferences || undefined,
        excludeIngredients: excludeIngredients.length > 0 ? excludeIngredients : undefined,
        mealType,
        cookingTime: parseInt(cookingTime) || undefined,
        servings: parseInt(servings) || undefined,
      };

      const result = await AIRecipeService.generateRecipe(request);

      if (result.success && result.data) {
        const recipe = result.data;
        
        // Calculate nutrition if not provided
        if (!recipe.nutrition || recipe.nutrition.calories === 0) {
          recipe.nutrition = NutritionCalculatorService.calculateRecipeNutrition(
            recipe.ingredients,
            recipe.servings
          );
        }

        // Save to database
        await DatabaseService.saveRecipe(recipe);
        await DatabaseService.addToRecipeHistory(recipe.id);

        // Navigate to recipe detail
        navigation.navigate('RecipeDetail', { recipe, isNewRecipe: true });
      } else {
        Alert.alert('Generation Failed', result.error || 'Failed to generate recipe. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please check your internet connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMealTypeSelector = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Meal Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.mealTypeButton,
              mealType === type && styles.selectedMealType
            ]}
            onPress={() => setMealType(type as any)}
          >
            <Text style={[
              styles.mealTypeText,
              mealType === type && styles.selectedMealTypeText
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPreferencesModal = () => (
    <Modal
      visible={showPreferencesModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Quick Preferences</Text>
          <TouchableOpacity onPress={() => setShowPreferencesModal(false)}>
            <Text style={styles.modalCloseButton}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            Set your preferences to get more personalized recipes. You can change these in Settings later.
          </Text>
          
          <TouchableOpacity 
            style={styles.fullPreferencesButton}
            onPress={() => {
              setShowPreferencesModal(false);
              navigation.navigate('Preferences');
            }}
          >
            <Text style={styles.fullPreferencesButtonText}>Open Full Preferences</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate Recipe</Text>
          <TouchableOpacity 
            style={styles.preferencesButton}
            onPress={() => setShowPreferencesModal(true)}
          >
            <Text style={styles.preferencesButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Ingredients Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Available Ingredients</Text>
          
          {/* Input and Camera Button */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Add ingredient (e.g., tomato, onion)"
              value={currentIngredient}
              onChangeText={setCurrentIngredient}
              onSubmitEditing={() => addIngredient()}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleImagePicker}
              disabled={isImageProcessing}
            >
              {isImageProcessing ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Text style={styles.cameraButtonText}>📷</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => addIngredient(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Added Ingredients */}
          <View style={styles.ingredientsContainer}>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientTag}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <Text style={styles.removeButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {ingredients.length === 0 && (
            <Text style={styles.emptyIngredientsText}>
              Add ingredients manually or take a photo 📸
            </Text>
          )}
        </View>

        {/* Exclude Ingredients Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Exclude Ingredients (Optional)</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ingredients to avoid"
              value={currentExclude}
              onChangeText={setCurrentExclude}
              onSubmitEditing={addExcludeIngredient}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.ingredientsContainer}>
            {excludeIngredients.map((ingredient, index) => (
              <View key={index} style={[styles.ingredientTag, styles.excludeTag]}>
                <Text style={styles.excludeText}>{ingredient}</Text>
                <TouchableOpacity onPress={() => removeExcludeIngredient(index)}>
                  <Text style={styles.removeButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Meal Type Selection */}
        {renderMealTypeSelector()}

        {/* Recipe Parameters */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recipe Details</Text>
          
          <View style={styles.parameterRow}>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Cooking Time</Text>
              <TextInput
                style={styles.parameterInput}
                value={cookingTime}
                onChangeText={setCookingTime}
                keyboardType="numeric"
                placeholder="30"
              />
              <Text style={styles.parameterUnit}>minutes</Text>
            </View>
            
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Servings</Text>
              <TextInput
                style={styles.parameterInput}
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                placeholder="4"
              />
              <Text style={styles.parameterUnit}>people</Text>
            </View>
          </View>
        </View>

        {/* User Preferences Display */}
        {userPreferences && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Preferences</Text>
            <View style={styles.preferencesDisplay}>
              {userPreferences.dietaryRestrictions.length > 0 && (
                <Text style={styles.preferenceText}>
                  🥗 Diet: {userPreferences.dietaryRestrictions.join(', ')}
                </Text>
              )}
              {userPreferences.allergies.length > 0 && (
                <Text style={styles.preferenceText}>
                  ⚠️ Allergies: {userPreferences.allergies.join(', ')}
                </Text>
              )}
              {userPreferences.spiceLevel && (
                <Text style={styles.preferenceText}>
                  🌶️ Spice: {userPreferences.spiceLevel}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Preferences')}>
              <Text style={styles.editPreferencesText}>Edit Preferences →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, ingredients.length === 0 && styles.disabledButton]}
          onPress={generateRecipe}
          disabled={ingredients.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateButtonText}>Generating Recipe...</Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>
              🍳 Generate Recipe
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderPreferencesModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  preferencesButton: {
    padding: 8,
  },
  preferencesButtonText: {
    fontSize: 20,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  cameraButton: {
    width: 44,
    height: 44,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 20,
  },
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  suggestionText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  excludeTag: {
    backgroundColor: '#ff5722',
  },
  ingredientText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  excludeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  removeButton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  emptyIngredientsText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  mealTypeButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  selectedMealType: {
    backgroundColor: '#4CAF50',
  },
  mealTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedMealTypeText: {
    color: '#fff',
  },
  parameterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  parameterItem: {
    flex: 1,
  },
  parameterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  parameterInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
    textAlign: 'center',
  },
  parameterUnit: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  preferencesDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  editPreferencesText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomPadding: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  fullPreferencesButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fullPreferencesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecipeGeneratorScreen;
