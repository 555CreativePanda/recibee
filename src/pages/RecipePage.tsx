import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeEditor } from '../components/RecipeEditor';
import { Loader2, ArrowLeft, GitFork } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRecipe, forkRecipe, saveRecipe } from '../services/recipeService';
import { SEO } from '../components/SEO';

import { ForkTree } from '../components/ForkTree';

interface RecipePageProps {
  user: any;
  ensureAuth: (action: string) => boolean;
  setNotification: (notif: { title: string, message: string } | null) => void;
  starredRecipeIds: Set<string>;
}

export function RecipePage({ user, ensureAuth, setNotification, starredRecipeIds }: RecipePageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (editingRecipe) {
      window.scrollTo(0, 0);
    }
  }, [editingRecipe]);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    
    const fetchInitialRecipe = async () => {
      const data = await getRecipe(id);
      setRecipe(data);
      setIsLoading(false);
    };

    fetchInitialRecipe();

    // Listen for ALL recipes to build the fork tree
    const recipesQuery = query(
      collection(db, 'recipes'),
      orderBy('created_at', 'desc')
    );

    const unsubscribeAll = onSnapshot(recipesQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
        };
      }) as Recipe[];
      
      // Ensure unique recipes by ID to avoid duplicate key errors
      const uniqueFetched = fetched.filter((recipe, index, self) =>
        index === self.findIndex((t) => t.id === recipe.id)
      );
      setAllRecipes(uniqueFetched);
    });

    // Also listen for changes to the main recipe
    const unsubscribeRecipe = onSnapshot(doc(db, 'recipes', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecipe({
          ...data,
          id: docSnap.id,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString()
        } as Recipe);
      }
    });

    return () => {
      unsubscribeAll();
      unsubscribeRecipe();
    };
  }, [id]);

  const handleFork = (targetRecipe: Recipe) => {
    console.log('handleFork triggered in RecipePage.tsx for recipe:', targetRecipe.id);
    if (!ensureAuth('fork and modify recipes')) return;

    if (!user) return;

    const forkedRecipe: Recipe = {
      id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
      title: targetRecipe.title,
      ingredients: targetRecipe.ingredients ? [...targetRecipe.ingredients] : [],
      original_ingredients: targetRecipe.ingredients ? [...targetRecipe.ingredients] : [],
      steps: targetRecipe.steps ? [...targetRecipe.steps] : [],
      original_steps: targetRecipe.steps ? [...targetRecipe.steps] : [],
      prep_time: targetRecipe.prep_time || '',
      cook_time: targetRecipe.cook_time || '',
      servings: targetRecipe.servings || '',
      cuisine: targetRecipe.cuisine || '',
      course: targetRecipe.course || '',
      equipment: targetRecipe.equipment ? [...targetRecipe.equipment] : [],
      keywords: targetRecipe.keywords ? [...targetRecipe.keywords] : [],
      notes: targetRecipe.notes || '',
      parent_id: targetRecipe.id,
      user_id: user.uid,
      source_url: targetRecipe.source_url || null,
      created_at: new Date().toISOString(),
    };

    setEditingRecipe(forkedRecipe);
  };

  const handleSave = async (updatedRecipe: Recipe) => {
    if (!user) return;
    
    try {
      const isNew = updatedRecipe.id.startsWith('temp-');
      const savedId = await saveRecipe(updatedRecipe, user.uid);
      setEditingRecipe(null);
      
      if (isNew) {
        setNotification({
          title: 'Recipe Saved',
          message: updatedRecipe.parent_id ? 'Fork created successfully!' : 'New recipe created successfully!'
        });
        navigate(`/recipe/${savedId}`);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      setNotification({
        title: 'Save Failed',
        message: 'An error occurred while saving the recipe.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="text-carbon-blue-60 animate-spin" />
        <p className="text-sm font-mono text-carbon-gray-30">Loading recipe repository...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Recipe not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="text-carbon-blue-60 hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} />
          Back to repository
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEO 
        title={recipe.title} 
        description={`Learn how to make ${recipe.title} on ReciBee. View ingredients, steps, and fork this recipe to make it your own.`}
        recipeData={recipe}
      />
      <button 
        onClick={() => navigate('/explore')}
        className="text-carbon-gray-30 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back to repository
      </button>

      <AnimatePresence mode="wait">
        {editingRecipe ? (
          <motion.div
            key={`editor-${editingRecipe.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <RecipeEditor
              recipe={editingRecipe}
              onSave={handleSave}
              onCancel={() => setEditingRecipe(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`details-${id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-12"
          >
            <RecipeCard
              recipe={recipe}
              onFork={handleFork}
              onEdit={(r) => setEditingRecipe(r)}
              onRequireAuth={ensureAuth}
              isOwner={user ? recipe.user_id === user.uid : false}
              isStarred={starredRecipeIds.has(recipe.id)}
              user={user}
              expandedDefault={true}
            />

            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-carbon-gray-80 pb-4">
                <GitFork size={20} className="text-carbon-gray-30" />
                <h3 className="text-lg font-medium">Fork Hierarchy</h3>
              </div>

              <ForkTree 
                currentRecipeId={recipe.id} 
                allRecipes={allRecipes} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
