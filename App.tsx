/**
 * Recipe Generator App
 * A comprehensive mobile app for generating recipes based on available ingredients
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import FlashMessage from 'react-native-flash-message';
import { RootStackParamList } from './src/types/navigation';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import RecipeGeneratorScreen from './src/screens/RecipeGeneratorScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import PreferencesScreen from './src/screens/PreferencesScreen';
import SavedRecipesScreen from './src/screens/SavedRecipesScreen';

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="#4CAF50"
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#f8f9fa' },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Recipe Generator' }}
          />
          <Stack.Screen 
            name="RecipeGenerator" 
            component={RecipeGeneratorScreen}
            options={{ title: 'Generate Recipe' }}
          />
          <Stack.Screen 
            name="RecipeDetail" 
            component={RecipeDetailScreen}
            options={{ title: 'Recipe Details' }}
          />
          <Stack.Screen 
            name="Preferences" 
            component={PreferencesScreen}
            options={{ title: 'Preferences' }}
          />
          <Stack.Screen 
            name="SavedRecipes" 
            component={SavedRecipesScreen}
            options={{ title: 'Saved Recipes' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <FlashMessage position="top" />
    </>
  );
}

export default App;
