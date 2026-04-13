import { db, auth as firebaseAuth } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
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
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
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

export const getRecipe = async (id: string): Promise<Recipe | null> => {
  const path = `recipes/${id}`;
  try {
    const docSnap = await getDoc(doc(db, 'recipes', id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
      } as Recipe;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
};
