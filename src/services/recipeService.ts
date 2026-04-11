import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Recipe } from '../types';

export const saveRecipe = async (updatedRecipe: Recipe, userId: string) => {
  const isNew = updatedRecipe.id.startsWith('temp-');
  
  if (isNew) {
    const { id, ...recipeToInsert } = updatedRecipe;
    const docRef = await addDoc(collection(db, 'recipes'), {
      ...recipeToInsert,
      user_id: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return docRef.id;
  } else {
    const recipeRef = doc(db, 'recipes', updatedRecipe.id);
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
};

export const forkRecipe = async (recipe: Recipe, userId: string) => {
  console.log('forkRecipe service called for recipe:', recipe.id, 'by user:', userId);
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

    console.log('Attempting to addDoc with:', forkedRecipe);
    const docRef = await addDoc(collection(db, 'recipes'), forkedRecipe);
    console.log('forkRecipe successful, new doc ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Detailed error in forkRecipe service:', error);
    throw error;
  }
};

export const getRecipe = async (id: string): Promise<Recipe | null> => {
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
};
