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
  Dimensions,
} from 'react-native';
import { Recipe, UserPreferences } from '../types';
import { HomeScreenProps } from '../types/navigation';
import DatabaseService from '../services/DatabaseService';
import { formatCookingTime, searchRecipes, sortRecipes } from '../utils/recipeUtils';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'recent'>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchQuery, recipes, selectedFilter]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [savedRecipes, preferences] = await Promise.all([
        DatabaseService.getAllRecipes(),
        DatabaseService.getUserPreferences()
      ]);
      
      setRecipes(savedRecipes);
      setUserPreferences(preferences);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchRecipes(filtered, searchQuery);
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'favorites':
        filtered = filtered.filter(recipe => recipe.rating && recipe.rating >= 4);
        break;
      case 'recent':
        filtered = sortRecipes(filtered, 'date').slice(0, 10);
        break;
      default:
        filtered = sortRecipes(filtered, 'date');
    }

    setFilteredRecipes(filtered);
  };

  const navigateToRecipeGenerator = () => {
    navigation.navigate('RecipeGenerator');
  };

  const navigateToRecipeDetail = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const navigateToSavedRecipes = () => {
    navigation.navigate('SavedRecipes');
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={[styles.quickActionButton, styles.primaryAction]}
        onPress={navigateToRecipeGenerator}
      >
        <Text style={styles.quickActionIcon}>🍳</Text>
        <Text style={styles.quickActionText}>Generate Recipe</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={navigateToSavedRecipes}
      >
        <Text style={styles.quickActionIcon}>📚</Text>
        <Text style={styles.quickActionText}>Saved Recipes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate('Preferences')}
      >
        <Text style={styles.quickActionIcon}>⚙️</Text>
        <Text style={styles.quickActionText}>Preferences</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterTabsContainer}>
      {[
        { key: 'all', label: 'All Recipes' },
        { key: 'favorites', label: 'Favorites' },
        { key: 'recent', label: 'Recent' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.filterTab,
            selectedFilter === tab.key && styles.activeFilterTab
          ]}
          onPress={() => setSelectedFilter(tab.key as any)}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === tab.key && styles.activeFilterTabText
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecipeCard = (recipe: Recipe) => (
    <TouchableOpacity
      key={recipe.id}
      style={styles.recipeCard}
      onPress={() => navigateToRecipeDetail(recipe)}
    >
      <View style={styles.recipeCardHeader}>
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
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>🍳</Text>
      <Text style={styles.emptyStateTitle}>No recipes yet!</Text>
      <Text style={styles.emptyStateDescription}>
        Start by generating your first recipe with available ingredients
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={navigateToRecipeGenerator}
      >
        <Text style={styles.emptyStateButtonText}>Generate Recipe</Text>
      </TouchableOpacity>
    </View>
  );

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
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recipe Generator</Text>
          <Text style={styles.headerSubtitle}>What would you like to cook today?</Text>
        </View>

        {/* Quick Actions */}
        {renderQuickActions()}

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

        {/* Filter Tabs */}
        {recipes.length > 0 && renderFilterTabs()}

        {/* Recipes List */}
        <View style={styles.recipesContainer}>
          {filteredRecipes.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                {selectedFilter === 'all' ? 'All Recipes' :
                 selectedFilter === 'favorites' ? 'Your Favorites' : 'Recent Recipes'}
                {searchQuery && ` (${filteredRecipes.length} found)`}
              </Text>
              
              {filteredRecipes.map(renderRecipeCard)}
            </>
          ) : recipes.length > 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsTitle}>No recipes found</Text>
              <Text style={styles.noResultsDescription}>
                {searchQuery 
                  ? `No recipes match "${searchQuery}"`
                  : selectedFilter === 'favorites' 
                    ? 'No favorite recipes yet'
                    : 'No recent recipes found'
                }
              </Text>
            </View>
          ) : (
            renderEmptyState()
          )}
        </View>
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
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  searchContainer: {
    margin: 20,
    marginTop: 10,
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
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterTab: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  recipesContainer: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeCardHeader: {
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
});

export default HomeScreen;
