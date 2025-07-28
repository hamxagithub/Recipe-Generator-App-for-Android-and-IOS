import { StackScreenProps } from '@react-navigation/stack';
import { Recipe } from './index';

// Define the navigation parameter list
export type RootStackParamList = {
  Home: undefined;
  RecipeGenerator: undefined;
  RecipeDetail: { recipe: Recipe; isNewRecipe?: boolean };
  Preferences: undefined;
  SavedRecipes: undefined;
};

// Export screen prop types for components that need them
export type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;
export type RecipeGeneratorScreenProps = StackScreenProps<RootStackParamList, 'RecipeGenerator'>;
export type RecipeDetailScreenProps = StackScreenProps<RootStackParamList, 'RecipeDetail'>;
export type PreferencesScreenProps = StackScreenProps<RootStackParamList, 'Preferences'>;
export type SavedRecipesScreenProps = StackScreenProps<RootStackParamList, 'SavedRecipes'>;

// Type the navigation prop specifically
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
