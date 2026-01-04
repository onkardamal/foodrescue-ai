
export enum FoodCategory {
  PRODUCE = 'Produce',
  DAIRY = 'Dairy',
  MEAT = 'Meat',
  GRAINS = 'Grains',
  BAKERY = 'Bakery',
  CANNED = 'Canned',
  OTHER = 'Other'
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  expiryDate: string; // ISO date string
  imageUrl?: string;
  status: 'active' | 'consumed' | 'donated' | 'wasted';
  condition?: string; // e.g. "Fresh", "Ripe", "Slightly Wilted"
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number; // minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  savedItems: string[]; // IDs of items used
}

export interface NGO {
  id: string;
  name: string;
  distance: string;
  needs: FoodCategory[];
  rating: number;
  coordinates: { lat: number, lng: number };
  urgency?: string;
}

export interface UserStats {
  mealsSaved: number;
  co2Saved: number; // in kg
  moneySaved: number; // in USD
  streakDays: number;
  level: number;
  xp: number;
}

export interface ScanResult {
  name: string;
  category: string;
  expiryEstimation: string; // "YYYY-MM-DD"
  quantityEstimation: number;
  unitEstimation: string;
  condition: string; // e.g. "Fresh", "Ripe", "Slightly Wilted"
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
