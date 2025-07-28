import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Recipe } from '../types';
import { RecipeDetailScreenProps } from '../types/navigation';
import DatabaseService from '../services/DatabaseService';
import { formatCookingTime, formatIngredientQuantity, recipeToText } from '../utils/recipeUtils';

const { width } = Dimensions.get('window');

const RecipeDetailScreen = ({ navigation, route }: RecipeDetailScreenProps) => {
  const { recipe: initialRecipe, isNewRecipe } = route.params;
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [isSaved, setIsSaved] = useState(!isNewRecipe);
  const [userRating, setUserRating] = useState<number>(recipe.rating || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isNewRecipe) {
      // Show success message for new recipe
      Alert.alert(
        'Recipe Generated! 🎉',
        `"${recipe.name}" has been created successfully!`,
        [{ text: 'Great!', style: 'default' }]
      );
    }
  }, []);

  const handleSaveRecipe = async () => {
    try {
      setIsLoading(true);
      const success = await DatabaseService.saveRecipe(recipe);
      
      if (success) {
        setIsSaved(true);
        Alert.alert('Recipe Saved!', 'Recipe has been saved to your collection.');
      } else {
        Alert.alert('Error', 'Failed to save recipe. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while saving the recipe.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateRecipe = async (rating: number) => {
    try {
      setUserRating(rating);
      const updatedRecipe = { ...recipe, rating };
      setRecipe(updatedRecipe);
      
      if (isSaved) {
        await DatabaseService.rateRecipe(recipe.id, rating);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save rating.');
    }
  };

  const handleShareRecipe = async () => {
    try {
      const recipeText = recipeToText(recipe);
      await Share.share({
        message: recipeText,
        title: recipe.name,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share recipe.');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        {!isSaved && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveRecipe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save</Text>
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShareRecipe}
        >
          <Text style={styles.shareButtonText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecipeTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.recipeTitle}>{recipe.name}</Text>
      {recipe.description && (
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
      )}
      
      <View style={styles.recipeMetadata}>
        <View style={styles.metadataItem}>
          <Text style={styles.metadataIcon}>⏱️</Text>
          <Text style={styles.metadataText}>{formatCookingTime(recipe.cookingTime)}</Text>
        </View>
        
        <View style={styles.metadataItem}>
          <Text style={styles.metadataIcon}>👥</Text>
          <Text style={styles.metadataText}>{recipe.servings} servings</Text>
        </View>
        
        <View style={styles.metadataItem}>
          <Text style={styles.metadataIcon}>📊</Text>
          <Text style={styles.metadataText}>{recipe.difficulty}</Text>
        </View>
        
        {recipe.cuisine && (
          <View style={styles.metadataItem}>
            <Text style={styles.metadataIcon}>🌍</Text>
            <Text style={styles.metadataText}>{recipe.cuisine}</Text>
          </View>
        )}
      </View>

      {recipe.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {recipe.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderRatingSection = () => (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingTitle}>Rate this recipe:</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRateRecipe(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.starText,
              star <= userRating && styles.starSelected
            ]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {userRating > 0 && (
        <Text style={styles.ratingText}>You rated this {userRating}/5 stars</Text>
      )}
    </View>
  );

  const renderIngredients = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>📝 Ingredients</Text>
      {recipe.ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientItem}>
          <Text style={styles.ingredientBullet}>•</Text>
          <Text style={styles.ingredientText}>
            {formatIngredientQuantity(ingredient)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderInstructions = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>👨‍🍳 Instructions</Text>
      {recipe.steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );

  const renderNutrition = () => {
    if (!recipe.nutrition) return null;

    const { nutrition } = recipe;
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📊 Nutrition (per serving)</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutrition.fiber}g</Text>
            <Text style={styles.nutritionLabel}>Fiber</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{nutrition.sodium}mg</Text>
            <Text style={styles.nutritionLabel}>Sodium</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderRecipeTitle()}
        {renderRatingSection()}
        {renderIngredients()}
        {renderInstructions()}
        {renderNutrition()}
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.generateAnotherButton}
            onPress={() => {
              navigation.navigate('RecipeGenerator');
            }}
          >
            <Text style={styles.generateAnotherButtonText}>
              🍳 Generate Another Recipe
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => {
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.backToHomeButtonText}>
              🏠 Back to Home
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
  },
  shareButtonText: {
    fontSize: 20,
  },
  titleContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 34,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  recipeMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  ratingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 28,
    opacity: 0.3,
  },
  starSelected: {
    opacity: 1,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ingredientBullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 12,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 22,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    alignItems: 'center',
    width: (width - 80) / 3, // 3 items per row with padding
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    padding: 20,
    gap: 12,
  },
  generateAnotherButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateAnotherButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToHomeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  backToHomeButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default RecipeDetailScreen;
