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
  StatusBar,
} from 'react-native';
import { Recipe, UserPreferences, QuickAction } from '../types';
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
  const [showWelcome, setShowWelcome] = useState(true);

  const quickActions: QuickAction[] = [
    {
      id: 'generate',
      title: 'Create Recipe',
      subtitle: 'From your ingredients',
      icon: '🍳',
      color: '#4CAF50',
      action: 'RecipeGenerator'
    },
    {
      id: 'camera',
      title: 'Scan Ingredients',
      subtitle: 'Take a photo',
      icon: '📸',
      color: '#2196F3',
      action: 'RecipeGenerator'
    },
    {
      id: 'saved',
      title: 'My Recipes',
      subtitle: 'View saved recipes',
      icon: '📚',
      color: '#FF9800',
      action: 'SavedRecipes'
    },
    {
      id: 'preferences',
      title: 'Settings',
      subtitle: 'Diet & preferences',
      icon: '⚙️',
      color: '#9C27B0',
      action: 'Preferences'
    }
  ];

  useEffect(() => {
    loadInitialData();
    // Hide welcome message after first use
    setTimeout(() => setShowWelcome(false), 5000);
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
      Alert.alert('Oops!', 'Had trouble loading your recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    if (searchQuery.trim()) {
      filtered = searchRecipes(filtered, searchQuery);
    }

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

  const handleQuickAction = (action: string) => {
    if (action === 'RecipeGenerator') {
      navigation.navigate('RecipeGenerator');
    } else {
      navigation.navigate(action as any);
    }
  };

  const renderWelcomeCard = () => {
    if (!showWelcome) return null;

    return (
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>👋 Welcome to Recipe Generator!</Text>
          <Text style={styles.welcomeText}>
            Turn your ingredients into delicious meals in just a few taps
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.welcomeCloseButton}
          onPress={() => setShowWelcome(false)}
        >
          <Text style={styles.welcomeCloseText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>What would you like to do?</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickActionCard, { backgroundColor: action.color }]}
            onPress={() => handleQuickAction(action.action)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
            <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {recipes.length > 0 && (
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All', count: recipes.length },
            { key: 'favorites', label: 'Favorites', count: recipes.filter(r => r.rating && r.rating >= 4).length },
            { key: 'recent', label: 'Recent', count: Math.min(recipes.length, 10) }
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
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#666';
    }
  };

  const renderRecipeCard = (recipe: Recipe) => (
    <TouchableOpacity
      key={recipe.id}
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', { recipe })}
      activeOpacity={0.9}
    >
      <View style={styles.recipeCardContent}>
        <View style={styles.recipeHeader}>
          <View style={styles.recipeMainInfo}>
            <Text style={styles.recipeTitle} numberOfLines={2}>
              {recipe.name}
            </Text>
            {recipe.description && (
              <Text style={styles.recipeDescription} numberOfLines={2}>
                {recipe.description}
              </Text>
            )}
          </View>
          
          {recipe.rating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {recipe.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.recipeMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>⏱️</Text>
            <Text style={styles.metricText}>{formatCookingTime(recipe.cookingTime)}</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricIcon}>👥</Text>
            <Text style={styles.metricText}>{recipe.servings}</Text>
          </View>
          
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
            <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
          </View>
        </View>

        <View style={styles.ingredientsPreview}>
          <Text style={styles.ingredientsLabel}>Main ingredients:</Text>
          <Text style={styles.ingredientsText} numberOfLines={1}>
            {recipe.ingredients.slice(0, 4).map(ing => ing.name).join(', ')}
            {recipe.ingredients.length > 4 && '...'}
          </Text>
        </View>
      </View>
      
      <View style={styles.recipeCardArrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>�️</Text>
      <Text style={styles.emptyStateTitle}>No recipes yet!</Text>
      <Text style={styles.emptyStateDescription}>
        Let's create your first recipe from ingredients you have at home
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => navigation.navigate('RecipeGenerator')}
      >
        <Text style={styles.emptyStateButtonText}>🍳 Create First Recipe</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoResults = () => (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsIcon}>🔍</Text>
      <Text style={styles.noResultsTitle}>No recipes found</Text>
      <Text style={styles.noResultsDescription}>
        {searchQuery 
          ? `No recipes match "${searchQuery}"`
          : selectedFilter === 'favorites' 
            ? 'No favorite recipes yet. Rate some recipes with 4+ stars!'
            : 'No recent recipes found'
        }
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearSearchButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
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
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recipe Generator</Text>
          <Text style={styles.headerSubtitle}>
            {recipes.length > 0 
              ? `You have ${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`
              : 'Ready to cook something amazing?'
            }
          </Text>
        </View>

        {/* Welcome Card */}
        {renderWelcomeCard()}

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Search Section */}
        {renderSearchSection()}

        {/* Recipes List */}
        <View style={styles.recipesSection}>
          {filteredRecipes.length > 0 ? (
            <>
              <Text style={styles.recipesTitle}>
                {selectedFilter === 'all' ? 'Your Recipes' :
                 selectedFilter === 'favorites' ? 'Your Favorites' : 'Recent Recipes'}
              </Text>
              
              {filteredRecipes.map(renderRecipeCard)}
            </>
          ) : recipes.length > 0 ? (
            renderNoResults()
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    opacity: 0.9,
  },
  
  // Welcome Card
  welcomeCard: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  welcomeContent: {
    flex: 1,
    marginRight: 12,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  welcomeCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  welcomeCloseText: {
    fontSize: 18,
    color: '#1976D2',
    fontWeight: 'bold',
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 56) / 2,
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    color: '#666',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterTab: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterTabText: {
    color: '#fff',
  },

  // Recipes Section
  recipesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Recipe Cards
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  recipeCardContent: {
    flex: 1,
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 24,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ratingBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  ratingText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '700',
  },
  recipeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metricIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metricText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  ingredientsPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  ingredientsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  ingredientsText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  recipeCardArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    backgroundColor: '#f8f9fa',
  },
  arrowText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },

  // Empty States
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // No Results
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    textAlign: 'center',
  },
  noResultsDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  clearSearchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Legacy styles to maintain compatibility
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
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },

  // Utilities
  bottomPadding: {
    height: 20,
  },
});

export default HomeScreen;
