import { db, auth as firebaseAuth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc, 
  increment, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  where, 
  or,
  Timestamp, 
  getCountFromServer 
} from 'firebase/firestore';
import { Recipe } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { safeStringify } from '../lib/utils';

export const saveRecipe = async (updatedRecipe: Recipe, userId: string) => {
  const isNew = updatedRecipe.id.startsWith('temp-');
  const path = 'recipes';
  
  try {
    if (isNew) {
      const { id, ...recipeToInsert } = updatedRecipe;
      const docRef = await addDoc(collection(db, path), {
        ...recipeToInsert,
        user_id: userId,
        is_public: true, // Always public
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
        is_public: true, // Force public on update
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
      is_public: true, // Default to public
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
      where('is_public', '==', true),
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
    } else {
      // Check for admin status to bypass filters
      const userId = firebaseAuth.currentUser?.uid;
      const userEmail = firebaseAuth.currentUser?.email;
      let isAdminUser = false;
      if (userId) {
        if (userEmail === 'chandra.mayur@gmail.com') {
          isAdminUser = true;
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', userId));
            isAdminUser = adminDoc.exists();
          } catch (e) {
            // ignore
          }
        }
      }

      if (isAdminUser) {
        console.log('[RecipeService] Admin detected - counting all recipes without filters');
      } else if (userId) {
        // "All" tab for logged in users: Show public recipes OR current user's own recipes
        q = query(q, or(where('is_public', '==', true), where('user_id', '==', userId)));
      } else {
        // "All" tab for guests: Show all public recipes
        // We MUST use the explicit filter for public recipes so the security rules don't reject the list query
        console.log('[RecipeService] Guest detected - counting Public recipes');
        q = query(q, where('is_public', '==', true));
      }
    }
    
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;
    console.log(`[RecipeService] getRecipesCount for filters:`, filters, 'Result:', count);
    return count;
  } catch (error: any) {
    console.error('[RecipeService] Error getting recipe count:', error);
    handleFirestoreError(error, OperationType.COUNT, 'recipes');
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
    } else {
      // Check for admin status to bypass filters
      const userId = firebaseAuth.currentUser?.uid;
      const userEmail = firebaseAuth.currentUser?.email;
      let isAdminUser = false;
      if (userId) {
        if (userEmail === 'chandra.mayur@gmail.com') {
          isAdminUser = true;
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', userId));
            isAdminUser = adminDoc.exists();
          } catch (e) {
            // ignore
          }
        }
      }

      if (isAdminUser) {
        console.log('[RecipeService] Admin detected - fetching all recipes without filters');
      } else if (userId) {
        // "All" tab for logged in users: Show public recipes OR current user's own recipes
        q = query(q, or(where('is_public', '==', true), where('user_id', '==', userId)));
      } else {
        // "All" tab for guests: Show all public recipes
        // We MUST use the explicit filter for public recipes so the security rules don't reject the list query
        console.log('[RecipeService] Guest detected - fetching Public recipes');
        q = query(q, where('is_public', '==', true));
      }
    }

    if (lastVisibleDoc) {
      q = query(q, startAfter(lastVisibleDoc));
    }

    console.log(`[RecipeService] Executing query for ${path}...`);
    const snapshot = await getDocs(q);
    console.log(`[RecipeService] Found ${snapshot.docs.length} docs for ${path}`);
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
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      console.error('CRITICAL: This query requires multiple indexes. Check the index URL in the console.');
    }
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

    // Fetch missing individually to avoid list permission errors with 'in' queries
    const fetchedRecipes: Recipe[] = [...cached];
    await Promise.all(missingIds.map(async (id) => {
      try {
        const docSnap = await getDoc(doc(db, 'recipes', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const recipe = {
            ...data,
            id: docSnap.id,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
          } as Recipe;
          
          recipeCache[recipe.id] = { data: recipe, timestamp: Date.now() };
          fetchedRecipes.push(recipe);
        }
      } catch (e) {
        console.warn(`Could not fetch starred recipe ${id}:`, e);
      }
    }));

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

export const healRecipes = async () => {
  console.log('[RecipeService] Starting database repair/healing...');
  try {
    const snapshot = await getDocs(collection(db, 'recipes'));
    let healedCount = 0;
    
    const promises = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const updates: any = {};
      
      // Ensure EVERYTHING is public for the "public box" experience
      if (data.is_public !== true) {
        updates.is_public = true;
      }

      // Add missing timestamps - ORDER BY requires these fields to exist!
      if (!data.created_at) {
        updates.created_at = serverTimestamp();
      }
      if (!data.updated_at) {
        updates.updated_at = serverTimestamp();
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(docSnap.ref, updates);
        healedCount++;
      }
    });
    
    await Promise.all(promises);
    console.log(`[RecipeService] Healing complete. Repaired ${healedCount} recipes.`);
    return healedCount;
  } catch (err) {
    console.error('[RecipeService] Error healing recipes:', err);
    throw err;
  }
};
