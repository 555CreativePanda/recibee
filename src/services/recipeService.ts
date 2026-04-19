import { db, auth as firebaseAuth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc, increment, getDocs, query, orderBy, limit, startAfter, where, Timestamp, getCountFromServer } from 'firebase/firestore';
import { Recipe } from '../types';
import { safeStringify } from '../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid,
      email: firebaseAuth.currentUser?.email,
      emailVerified: firebaseAuth.currentUser?.emailVerified,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous,
      tenantId: firebaseAuth.currentUser?.tenantId,
      providerInfo: firebaseAuth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', safeStringify(errInfo));
  throw new Error(safeStringify(errInfo));
}

export const saveRecipe = async (updatedRecipe: Recipe, userId: string) => {
  const isNew = updatedRecipe.id.startsWith('temp-');
  const path = 'recipes';
  
  try {
    if (isNew) {
      const { id, ...recipeToInsert } = updatedRecipe;
      const docRef = await addDoc(collection(db, path), {
        ...recipeToInsert,
        user_id: userId,
        star_count: 0,
        fork_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // If this is a fork, increment the parent's fork count
      if (updatedRecipe.parent_id) {
        try {
          const parentRef = doc(db, 'recipes', updatedRecipe.parent_id);
          await updateDoc(parentRef, {
            fork_count: increment(1)
          });
        } catch (err) {
          console.error('Error incrementing parent fork count:', err);
        }
      }

      return docRef.id;
    } else {
      const recipeRef = doc(db, path, updatedRecipe.id);
      await updateDoc(recipeRef, {
        title: updatedRecipe.title,
        ingredients: updatedRecipe.ingredients,
        original_ingredients: updatedRecipe.original_ingredients ?? null,
        steps: updatedRecipe.steps,
        original_steps: updatedRecipe.original_steps ?? null,
        prep_time: updatedRecipe.prep_time || null,
        cook_time: updatedRecipe.cook_time || null,
        servings: updatedRecipe.servings || null,
        cuisine: updatedRecipe.cuisine || null,
        course: updatedRecipe.course || null,
        equipment: updatedRecipe.equipment || [],
        keywords: updatedRecipe.keywords || [],
        notes: updatedRecipe.notes || null,
        parent_id: updatedRecipe.parent_id || null,
        parent_title: updatedRecipe.parent_title || null,
        parent_user_id: updatedRecipe.parent_user_id || null,
        source_url: updatedRecipe.source_url || null,
        updated_at: serverTimestamp()
      });
      return updatedRecipe.id;
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, isNew ? path : `${path}/${updatedRecipe.id}`);
    throw error;
  }
};

export const forkRecipe = async (recipe: Recipe, userId: string) => {
  const path = 'recipes';
  try {
    const forkedRecipe = {
      title: `${recipe.title || 'Untitled'} (fork)`,
      ingredients: recipe.ingredients ? [...recipe.ingredients] : [],
      steps: recipe.steps ? [...recipe.steps] : [],
      prep_time: recipe.prep_time || null,
      cook_time: recipe.cook_time || null,
      servings: recipe.servings || null,
      cuisine: recipe.cuisine || null,
      course: recipe.course || null,
      equipment: recipe.equipment ? [...recipe.equipment] : [],
      keywords: recipe.keywords ? [...recipe.keywords] : [],
      notes: recipe.notes || null,
      parent_id: recipe.id,
      parent_title: recipe.title,
      parent_user_id: recipe.user_id,
      user_id: userId,
      source_url: recipe.source_url || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, path), forkedRecipe);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

// Simple global cache to reduce reads
let recipeCache: Record<string, { data: Recipe; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Tab cache to avoid re-fetching when switching tabs
let tabCache: Record<string, { recipes: Recipe[]; lastVisible: any; hasMore: boolean }> = {};

// Child forks cache
let forksCache: Record<string, { forks: Recipe[]; timestamp: number }> = {};

export const clearRecipeCache = (id?: string) => {
  if (id) {
    delete recipeCache[id];
    delete forksCache[id];
  } else {
    recipeCache = {};
    forksCache = {};
  }
};

export const clearTabCache = (tab?: string) => {
  if (tab) {
    delete tabCache[tab];
  } else {
    tabCache = {};
  }
};

export const getTabCache = (tab: string) => tabCache[tab];
export const setTabCache = (tab: string, data: { recipes: Recipe[]; lastVisible: any; hasMore: boolean }) => {
  tabCache[tab] = data;
};

export const getChildForks = async (parentId: string, limitCount = 5) => {
  const now = Date.now();
  if (forksCache[parentId] && (now - forksCache[parentId].timestamp < CACHE_TTL)) {
    return forksCache[parentId].forks;
  }

  try {
    const q = query(
      collection(db, 'recipes'),
      where('parent_id', '==', parentId),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const forks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
      } as Recipe;
    });

    forksCache[parentId] = { forks, timestamp: Date.now() };
    return forks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `recipes (forks of ${parentId})`);
    throw error;
  }
};

export const getRecipesCount = async (filters?: { userId?: string }) => {
  try {
    let q = query(collection(db, 'recipes'));
    
    if (filters?.userId) {
      q = query(q, where('user_id', '==', filters.userId));
    }
    
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting recipe count:', error);
    return 0;
  }
};

export const getRecipesPaginated = async (
  limitCount: number = 10,
  lastVisibleDoc?: any,
  filters?: {
    userId?: string;
    starredIds?: string[];
    searchQuery?: string;
  }
) => {
  const path = 'recipes';
  try {
    let q = query(
      collection(db, path),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );

    if (filters?.userId) {
      q = query(q, where('user_id', '==', filters.userId));
    }

    if (lastVisibleDoc) {
      q = query(q, startAfter(lastVisibleDoc));
    }

    const snapshot = await getDocs(q);
    const recipes = snapshot.docs.map(doc => {
      const data = doc.data();
      const recipe = {
        ...data,
        id: doc.id,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
      } as Recipe;
      
      // Update cache
      recipeCache[recipe.id] = { data: recipe, timestamp: Date.now() };
      
      return recipe;
    });

    return {
      recipes,
      lastVisible: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const getRecipesByIds = async (ids: string[]) => {
  if (ids.length === 0) return [];
  
  const path = 'recipes';
  try {
    // Check cache first
    const now = Date.now();
    const cached = ids
      .map(id => recipeCache[id])
      .filter(c => c && (now - c.timestamp < CACHE_TTL))
      .map(c => c!.data);
    
    const missingIds = ids.filter(id => !recipeCache[id] || (now - recipeCache[id].timestamp >= CACHE_TTL));
    
    if (missingIds.length === 0) return cached;

    // Fetch missing in chunks of 30 (Firestore limit for 'in' query)
    const fetchedRecipes: Recipe[] = [...cached];
    for (let i = 0; i < missingIds.length; i += 30) {
      const chunk = missingIds.slice(i, i + 30);
      const q = query(collection(db, path), where('__name__', 'in', chunk));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const recipe = {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
        } as Recipe;
        
        recipeCache[recipe.id] = { data: recipe, timestamp: Date.now() };
        fetchedRecipes.push(recipe);
      });
    }

    return fetchedRecipes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const getRecipe = async (id: string): Promise<Recipe | null> => {
  const path = `recipes/${id}`;
  
  // Check cache
  const now = Date.now();
  if (recipeCache[id] && (now - recipeCache[id].timestamp < CACHE_TTL)) {
    return recipeCache[id].data;
  }

  try {
    const docSnap = await getDoc(doc(db, 'recipes', id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const recipe = {
        id: docSnap.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
      } as Recipe;
      
      recipeCache[id] = { data: recipe, timestamp: Date.now() };
      return recipe;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
};
