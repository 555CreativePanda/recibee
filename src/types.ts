export interface Ingredient {
  id?: string;
  item: string;
  amount: string;
  unit: string;
  isHeader?: boolean;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string | null;
  photoURL: string | null;
  bio?: string | null;
  updated_at?: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: Ingredient[];
  original_ingredients?: Ingredient[] | null;
  steps: string[];
  original_steps?: string[] | null;
  prep_time?: string | null;
  cook_time?: string | null;
  servings?: string | null;
  cuisine?: string | null;
  course?: string | null;
  equipment?: string[] | null;
  keywords?: string[] | null;
  notes?: string | null;
  parent_id: string | null;
  user_id: string;
  source_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  user_id: string;
  user_email?: string;
  upvotes: number;
  score: number;
  created_at: string;
}

export interface FeatureVote {
  feature_id: string;
  user_id: string;
  type: 'up';
  created_at: string;
}
