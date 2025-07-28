import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import { UserPreferences } from '../types';
import { PreferencesScreenProps } from '../types/navigation';
import DatabaseService from '../services/DatabaseService';

const PreferencesScreen = ({ navigation }: PreferencesScreenProps) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    allergies: [],
    tastePreferences: [],
    cuisinePreferences: [],
    spiceLevel: 'Medium',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Halal',
    'Kosher',
  ];

  const allergyOptions = [
    'Nuts',
    'Dairy',
    'Eggs',
    'Shellfish',
    'Fish',
    'Soy',
    'Wheat',
    'Sesame',
  ];

  const tasteOptions = [
    'Sweet',
    'Savory',
    'Spicy',
    'Tangy',
    'Umami',
    'Fresh',
    'Herby',
    'Smoky',
  ];

  const cuisineOptions = [
    'Italian',
    'Chinese',
    'Indian',
    'Mexican',
    'Japanese',
    'Thai',
    'Mediterranean',
    'American',
    'French',
    'Korean',
    'Middle Eastern',
    'African',
  ];

  const spiceLevels = ['Mild', 'Medium', 'Hot'] as const;

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const savedPreferences = await DatabaseService.getUserPreferences();
      if (savedPreferences) {
        setPreferences(savedPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const success = await DatabaseService.saveUserPreferences(preferences);
      
      if (success) {
        Alert.alert(
          'Preferences Saved!',
          'Your preferences have been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while saving preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  const updateDietaryRestrictions = (restriction: string) => {
    setPreferences({
      ...preferences,
      dietaryRestrictions: toggleArrayItem(preferences.dietaryRestrictions, restriction),
    });
  };

  const updateAllergies = (allergy: string) => {
    setPreferences({
      ...preferences,
      allergies: toggleArrayItem(preferences.allergies, allergy),
    });
  };

  const updateTastePreferences = (taste: string) => {
    setPreferences({
      ...preferences,
      tastePreferences: toggleArrayItem(preferences.tastePreferences, taste),
    });
  };

  const updateCuisinePreferences = (cuisine: string) => {
    setPreferences({
      ...preferences,
      cuisinePreferences: toggleArrayItem(preferences.cuisinePreferences, cuisine),
    });
  };

  const renderOptionGroup = (
    title: string,
    options: string[],
    selectedItems: string[],
    onToggle: (item: string) => void,
    icon: string
  ) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              selectedItems.includes(option) && styles.selectedOption,
            ]}
            onPress={() => onToggle(option)}
          >
            <Text
              style={[
                styles.optionText,
                selectedItems.includes(option) && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSpiceLevelSelector = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>🌶️ Spice Level</Text>
      <View style={styles.spiceLevelContainer}>
        {spiceLevels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.spiceLevelButton,
              preferences.spiceLevel === level && styles.selectedSpiceLevel,
            ]}
            onPress={() => setPreferences({ ...preferences, spiceLevel: level })}
          >
            <Text
              style={[
                styles.spiceLevelText,
                preferences.spiceLevel === level && styles.selectedSpiceLevelText,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSummary = () => {
    const totalSelections = 
      preferences.dietaryRestrictions.length +
      preferences.allergies.length +
      preferences.tastePreferences.length +
      preferences.cuisinePreferences.length;

    if (totalSelections === 0) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>📋 Your Preferences Summary</Text>
        
        {preferences.dietaryRestrictions.length > 0 && (
          <Text style={styles.summaryText}>
            🥗 Diet: {preferences.dietaryRestrictions.join(', ')}
          </Text>
        )}
        
        {preferences.allergies.length > 0 && (
          <Text style={styles.summaryText}>
            ⚠️ Allergies: {preferences.allergies.join(', ')}
          </Text>
        )}
        
        {preferences.tastePreferences.length > 0 && (
          <Text style={styles.summaryText}>
            👅 Taste: {preferences.tastePreferences.join(', ')}
          </Text>
        )}
        
        {preferences.cuisinePreferences.length > 0 && (
          <Text style={styles.summaryText}>
            🌍 Cuisine: {preferences.cuisinePreferences.join(', ')}
          </Text>
        )}
        
        <Text style={styles.summaryText}>
          🌶️ Spice Level: {preferences.spiceLevel}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading preferences...</Text>
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
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Personalize Your Recipes</Text>
          <Text style={styles.introText}>
            Set your preferences to get personalized recipe recommendations that match your dietary needs and taste preferences.
          </Text>
        </View>

        {renderOptionGroup(
          'Dietary Restrictions',
          dietaryOptions,
          preferences.dietaryRestrictions,
          updateDietaryRestrictions,
          '🥗'
        )}

        {renderOptionGroup(
          'Allergies & Intolerances',
          allergyOptions,
          preferences.allergies,
          updateAllergies,
          '⚠️'
        )}

        {renderSpiceLevelSelector()}

        {renderOptionGroup(
          'Taste Preferences',
          tasteOptions,
          preferences.tastePreferences,
          updateTastePreferences,
          '👅'
        )}

        {renderOptionGroup(
          'Favorite Cuisines',
          cuisineOptions,
          preferences.cuisinePreferences,
          updateCuisinePreferences,
          '🌍'
        )}

        {renderSummary()}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={savePreferences}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : '💾 Save Preferences'}
          </Text>
        </TouchableOpacity>

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
  placeholder: {
    width: 40,
  },
  introContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
  },
  spiceLevelContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  spiceLevelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedSpiceLevel: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  spiceLevelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  selectedSpiceLevelText: {
    color: '#fff',
  },
  summaryContainer: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    margin: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 6,
    lineHeight: 20,
  },
  saveButton: {
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
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default PreferencesScreen;
