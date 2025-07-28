import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Recipe } from '../types';
import { SavedRecipesScreenProps } from '../types/navigation';
import DatabaseService from '../services/DatabaseService';
import { formatCookingTime, searchRecipes, sortRecipes } from '../utils/recipeUtils';

const SavedRecipesScreen = ({ navigation }: SavedRecipesScreenProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating' | 'cookingTime'>('date');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterAndSortRecipes();
  }, [searchQuery, sortBy, recipes]);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      const savedRecipes = await DatabaseService.getAllRecipes();
      setRecipes(savedRecipes);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadRecipes();
    setIsRefreshing(false);
  }, []);

  const filterAndSortRecipes = () => {
    let filtered = recipes;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchRecipes(filtered, searchQuery);
    }

    // Apply sorting
    filtered = sortRecipes(filtered, sortBy);

    setFilteredRecipes(filtered);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteRecipe(recipeId);
              setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const renderSortOptions = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
      {[
        { key: 'date', label: 'Recent', icon: '📅' },
        { key: 'name', label: 'Name', icon: '🔤' },
        { key: 'rating', label: 'Rating', icon: '⭐' },
        { key: 'cookingTime', label: 'Time', icon: '⏱️' },
      ].map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.sortButton,
            sortBy === option.key && styles.activeSortButton,
          ]}
          onPress={() => setSortBy(option.key as any)}
        >
          <Text style={styles.sortIcon}>{option.icon}</Text>
          <Text
            style={[
              styles.sortText,
              sortBy === option.key && styles.activeSortText,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRecipeCard = (recipe: Recipe) => (
    <View key={recipe.id} style={styles.recipeCard}>
      <TouchableOpacity
        style={styles.recipeContent}
        onPress={() => navigation.navigate('RecipeDetail', { recipe })}
      >
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.name}
          </Text>
          {recipe.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {recipe.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {recipe.description && (
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {recipe.description}
          </Text>
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
        </View>

        {recipe.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {recipe.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{recipe.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteRecipe(recipe.id)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>📚</Text>
      <Text style={styles.emptyStateTitle}>No saved recipes</Text>
      <Text style={styles.emptyStateDescription}>
        Your saved recipes will appear here. Start by generating your first recipe!
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('RecipeGenerator')}
      >
        <Text style={styles.emptyStateButtonText}>Generate Recipe</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    if (recipes.length === 0) return null;

    const averageRating = recipes
      .filter(recipe => recipe.rating)
      .reduce((sum, recipe) => sum + (recipe.rating || 0), 0) / recipes.filter(recipe => recipe.rating).length;

    const averageCookingTime = recipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0) / recipes.length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{recipes.length}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {averageRating ? averageRating.toFixed(1) : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(averageCookingTime)}m</Text>
          <Text style={styles.statLabel}>Avg Time</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Recipes</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('RecipeGenerator')}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {renderStats()}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        {/* Sort Options */}
        {recipes.length > 0 && renderSortOptions()}

        {/* Recipes List */}
        <View style={styles.recipesContainer}>
          {filteredRecipes.length > 0 ? (
            <>
              <Text style={styles.recipesCount}>
                {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                {searchQuery && ` found for "${searchQuery}"`}
              </Text>
              {filteredRecipes.map(renderRecipeCard)}
            </>
          ) : recipes.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsTitle}>No recipes found</Text>
              <Text style={styles.noResultsDescription}>
                No recipes match your search for "{searchQuery}"
              </Text>
            </View>
          ) : (
            renderEmptyState()
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    padding: 8,
  },
  addButtonText: {
    fontSize: 20,
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    margin: 20,
    marginTop: 0,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    fontSize: 20,
  },
  sortContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  activeSortButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  sortIcon: {
    fontSize: 14,
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeSortText: {
    color: '#fff',
  },
  recipesContainer: {
    padding: 20,
    paddingTop: 10,
  },
  recipesCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  recipeContent: {
    flex: 1,
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeMetadata: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#ff5722',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  noResultsDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});

export default SavedRecipesScreen;
