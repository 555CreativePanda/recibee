import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDocs, limit } from 'firebase/firestore';
import { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeEditor } from '../components/RecipeEditor';
import { Loader2, ArrowLeft, GitFork } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRecipe, forkRecipe, saveRecipe, getChildForks } from '../services/recipeService';
import { SEO } from '../components/SEO';

import { ForkTree } from '../components/ForkTree';

interface RecipePageProps {
  user: any;
  ensureAuth: (action: string) => boolean;
  setNotification: (notif: { title: string, message: string } | null) => void;
  starredRecipeIds: Set<string>;
  onUserClick?: (uid: string) => void;
}

export function RecipePage({ user, ensureAuth, setNotification, starredRecipeIds, onUserClick }: RecipePageProps) {
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

    // Fetch direct forks once instead of listening to all recipes
    const fetchForks = async () => {
      try {
        if (id && !id.startsWith('temp-')) {
          const fetched = await getChildForks(id, 20);
          setAllRecipes(fetched);
        }
      } catch (error) {
        console.error('Error fetching forks:', error);
      }
    };

    fetchForks();

    let unsubscribeRecipe = () => {};
    if (id && !id.startsWith('temp-')) {
      unsubscribeRecipe = onSnapshot(doc(db, 'recipes', id), (docSnap) => {
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
    }

    return () => {
      unsubscribeRecipe();
    };
  }, [id]);

  const handleFork = (targetRecipe: Recipe) => {
    console.log('handleFork triggered in RecipePage.tsx for recipe:', targetRecipe.id);
    if (!ensureAuth('tweak recipes')) return;

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
      parent_title: targetRecipe.title,
      parent_user_id: targetRecipe.user_id,
      user_id: user.uid,
      is_public: true,
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
          message: updatedRecipe.parent_id ? 'Tweak saved successfully!' : 'New recipe saved successfully!'
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

  const handleDelete = () => {
    setNotification({
      title: 'Recipe Deleted',
      message: 'Recipe has been permanently removed.'
    });
    navigate('/explore');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <Loader2 size={40} className="text-kitchen-primary animate-spin" />
        <p className="text-sm font-bold text-kitchen-muted uppercase tracking-widest">Opening recipes...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-24 bg-stone-50 rounded-3xl border border-kitchen-border">
        <h2 className="text-3xl font-serif font-bold mb-6 text-kitchen-text">Recipe not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-kitchen-primary hover:bg-orange-700 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 uppercase tracking-widest flex items-center gap-3 mx-auto active:scale-95"
        >
          <ArrowLeft size={20} />
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEO 
        title={recipe.title} 
        description={`Learn how to make ${recipe.title} on ReciBee. View ingredients, steps, and tweak this recipe to make it your own.`}
        recipeData={recipe}
      />
      <button 
        onClick={() => navigate('/explore')}
        className="text-kitchen-muted hover:text-kitchen-primary flex items-center gap-2 transition-all text-sm font-bold uppercase tracking-widest group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Explore
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
            className="space-y-16"
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
              onUserClick={onUserClick}
              onDelete={handleDelete}
              allRecipes={allRecipes}
            />

            <div className="space-y-8">
              <div className="flex items-center gap-4 border-b border-kitchen-border pb-6">
                <div className="bg-stone-100 p-2 rounded-xl">
                  <GitFork size={24} className="text-kitchen-primary" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-kitchen-text">Recipe Lineage</h3>
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
