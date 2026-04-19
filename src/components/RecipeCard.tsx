import { GitFork, Edit2, ChevronRight, ChevronDown, Star, Globe, Lock, ExternalLink, Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Recipe, Ingredient, Step } from '../types';
import { cn, safeStringify } from '../lib/utils';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, setDoc, deleteDoc, getDocs, increment, updateDoc, limit } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { getChildForks } from '../services/recipeService';

interface RecipeCardProps {
  recipe: Recipe;
  onFork: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onRequireAuth: (action: string) => void;
  isOwner: boolean;
  isStarred: boolean;
  user: any;
  expandedDefault?: boolean;
  onUserClick?: (uid: string) => void;
  allRecipes?: Recipe[];
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onFork, 
  onEdit, 
  onRequireAuth, 
  isOwner,
  isStarred,
  user,
  expandedDefault = false,
  onUserClick,
  allRecipes = []
}) => {
  const [isExpanded, setIsExpanded] = useState(expandedDefault);
  const [childForks, setChildForks] = useState<Recipe[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isExpanded && childForks.length === 0) {
      const fetchForks = async () => {
        try {
          const fetchedForks = await getChildForks(recipe.id, 5);
          setChildForks(fetchedForks);
        } catch (error) {
          console.error('Error fetching forks:', error);
        }
      };
      fetchForks();
    }
  }, [isExpanded, recipe.id]);

  const handleStarToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth('star recipes');
      return;
    }
    
    const starId = `${user.uid}_${recipe.id}`;
    const starRef = doc(db, 'stars', starId);
    
    console.log('Toggling star for recipe:', recipe.id, 'Current state:', isStarred);
    
    try {
      const recipeRef = doc(db, 'recipes', recipe.id);
      if (isStarred) {
        console.log('Removing star...');
        await deleteDoc(starRef);
        await updateDoc(recipeRef, {
          star_count: increment(-1)
        });
      } else {
        console.log('Adding star...');
        await setDoc(starRef, {
          recipe_id: recipe.id,
          user_id: user.uid,
          created_at: new Date().toISOString()
        });
        await updateDoc(recipeRef, {
          star_count: increment(1)
        });
      }
    } catch (error: any) {
      console.error('Error toggling star:', error);
      
      // Enhanced error reporting for Firestore permissions
      if (error.code === 'permission-denied') {
        const errInfo = {
          error: error.message,
          operationType: isStarred ? 'delete' : 'write',
          path: `stars/${starId}`,
          authInfo: {
            userId: user.uid,
            email: user.email,
          }
        };
        console.error('Detailed Permission Error:', safeStringify(errInfo));
      }
    }
  };

  const scrollToRecipe = (id: string) => {
    const element = document.getElementById(`recipe-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Briefly highlight
      element.classList.add('ring-2', 'ring-orange-600');
      setTimeout(() => element.classList.remove('ring-2', 'ring-orange-600'), 2000);
    } else {
      navigate(`/recipe/${id}`);
    }
  };

  const getIngredientDiff = (ing: Ingredient, idx: number) => {
    const baseIngredients = recipe.original_ingredients;
    
    if (!baseIngredients || baseIngredients.length === 0) {
      return null;
    }

    // Use index-based comparison to track name changes
    const originalIng = baseIngredients[idx];
    
    if (!originalIng) return { type: 'new' };
    
    const changes: string[] = [];
    if ((originalIng.item || '').trim().toLowerCase() !== (ing.item || '').trim().toLowerCase()) changes.push('item');
    if ((originalIng.amount || '').trim() !== (ing.amount || '').trim()) changes.push('amount');
    if ((originalIng.unit || '').trim() !== (ing.unit || '').trim()) changes.push('unit');
    
    if (changes.length > 0) {
      console.log(`Diff found for ingredient at index ${idx}:`, {
        current: { item: ing.item, amount: ing.amount, unit: ing.unit },
        original: { item: originalIng.item, amount: originalIng.amount, unit: originalIng.unit },
        changes
      });
      return { 
        type: 'changed', 
        original: originalIng,
        fields: changes 
      };
    }
    
    return null;
  };

  const getStepDiff = (stepText: string, idx: number) => {
    const baseSteps = recipe.original_steps;
    if (!baseSteps || baseSteps.length === 0) return null;

    // Simple index-based comparison for steps
    const originalStep = baseSteps[idx];
    const originalText = (originalStep !== null && typeof originalStep === 'object') ? (originalStep as Step).text : (originalStep as string || '');
    
    if (originalStep === undefined) return { type: 'new' };
    if ((originalText || '').trim() !== (stepText || '').trim()) {
      return { type: 'changed', original: originalText };
    }
    
    return null;
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'recipes', recipe.id));
    } catch (error) {
      console.error('Error deleting recipe:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const userHandle = recipe.user_id ? recipe.user_id.slice(0, 8) : 'unknown';
  const navigate = useNavigate();

  const formatUpdateDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div id={`recipe-${recipe.id}`} className="bg-white rounded-3xl shadow-lg border border-kitchen-border overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
      {/* Recipe Header Style */}
      <div className="p-4 md:p-8 border-b border-kitchen-border bg-stone-50/30">
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Line 1: Actions & Tags */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full border border-kitchen-border text-[10px] text-kitchen-muted uppercase font-bold tracking-[0.1em] bg-white">
                Public
              </span>
              {recipe.parent_id && (
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-kitchen-primary border border-orange-100 px-3 py-1 rounded-full bg-orange-50">
                  <div className="w-1.5 h-1.5 bg-kitchen-primary rounded-full" />
                  <span>Tweaked</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFork(recipe);
                }}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-kitchen-primary hover:bg-orange-700 text-white px-4 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-bold transition-all rounded-xl md:rounded-2xl shadow-lg shadow-orange-100 uppercase tracking-widest active:scale-95"
              >
                <GitFork size={14} className="md:w-[16px]" />
                TWEAK
              </button>
              
              {isOwner && (
                <div className="flex flex-1 sm:flex-none gap-2 sm:gap-3">
                  <button
                    onClick={() => onEdit(recipe)}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-kitchen-text px-4 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-bold transition-all rounded-xl md:rounded-2xl uppercase tracking-widest active:scale-95"
                  >
                    <Edit2 size={14} className="md:w-[16px]" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-bold transition-all rounded-xl md:rounded-2xl uppercase tracking-widest active:scale-95"
                  >
                    <Trash2 size={14} className="md:w-[16px]" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Line 2: Identity & Date */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 min-w-0">
              <span 
                onClick={() => onUserClick?.(recipe.user_id)}
                className="text-kitchen-primary hover:underline cursor-pointer font-bold text-xs md:text-sm shrink-0 uppercase tracking-widest"
              >
                @{userHandle}
              </span>
              <span className="hidden sm:inline text-stone-300 shrink-0 font-light">/</span>
              <Link 
                to={`/recipe/${recipe.id}`}
                className="text-kitchen-text font-serif font-bold text-2xl md:text-3xl hover:text-kitchen-primary transition-colors truncate leading-tight overflow-hidden text-ellipsis"
              >
                {recipe.title}
              </Link>
            </div>
            
            <div className="text-[9px] md:text-[10px] font-bold text-kitchen-muted shrink-0 uppercase tracking-[0.2em]">
              Updated <span className="text-kitchen-text">{formatUpdateDate(recipe.updated_at || recipe.created_at)}</span>
            </div>
          </div>

          {/* Line 3: Stats & Source */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-kitchen-muted">
              <button 
                onClick={handleStarToggle}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  isStarred ? "text-kitchen-primary" : "hover:text-kitchen-primary"
                )}
              >
                <Star size={14} className="md:w-[16px]" fill={isStarred ? "currentColor" : "none"} />
                <span>{recipe.star_count || 0} <span className="hidden xs:inline">likes</span><span className="xs:hidden">L</span></span>
              </button>
              
              <div className="flex items-center gap-2 hover:text-kitchen-primary cursor-pointer">
                <GitFork size={14} className="md:w-[16px]" />
                <span>{recipe.fork_count || 0} <span className="hidden xs:inline">copies</span><span className="xs:hidden">C</span></span>
              </div>

              {recipe.parent_id && (
                <button 
                  onClick={() => scrollToRecipe(recipe.parent_id!)}
                  className="flex items-center gap-2 text-kitchen-primary hover:underline truncate max-w-[200px]"
                >
                  <GitFork size={14} className="md:w-[16px] rotate-180 shrink-0" />
                  <span className="truncate">from {recipe.parent_user_id ? `@${recipe.parent_user_id.slice(0, 8)} / ` : ''}{recipe.parent_title || recipe.parent_id.slice(0, 8)}</span>
                </button>
              )}
            </div>

            {recipe.source_url && (
              <a 
                href={recipe.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-kitchen-primary transition-colors truncate max-w-full sm:max-w-[200px]"
              >
                <Globe size={14} className="md:w-[16px]" />
                <span className="truncate">{new URL(recipe.source_url).hostname}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Bar */}
      {(recipe.prep_time || recipe.cook_time || recipe.servings || recipe.cuisine || recipe.course) && (
        <div className="px-4 md:px-8 py-4 md:py-6 bg-white border-b border-kitchen-border grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
          {recipe.prep_time && (
            <div className="space-y-1">
              <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-kitchen-muted">Prep</span>
              <p className="text-xs md:text-sm text-kitchen-text font-bold leading-tight">{recipe.prep_time}</p>
            </div>
          )}
          {recipe.cook_time && (
            <div className="space-y-1">
              <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-kitchen-muted">Cook</span>
              <p className="text-xs md:text-sm text-kitchen-text font-bold leading-tight">{recipe.cook_time}</p>
            </div>
          )}
          {recipe.servings && (
            <div className="space-y-1">
              <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-kitchen-muted">Servings</span>
              <p className="text-xs md:text-sm text-kitchen-text font-bold leading-tight">{recipe.servings}</p>
            </div>
          )}
          {recipe.cuisine && (
            <div className="space-y-1">
              <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-kitchen-muted">Cuisine</span>
              <p className="text-xs md:text-sm text-kitchen-text font-bold leading-tight">{recipe.cuisine}</p>
            </div>
          )}
          {recipe.course && (
            <div className="space-y-1">
              <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-kitchen-muted">Course</span>
              <p className="text-xs md:text-sm text-kitchen-text font-bold leading-tight">{recipe.course}</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            key="delete-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              key="delete-confirm-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-kitchen-border w-full max-w-md p-10 rounded-3xl shadow-2xl"
            >
              <div className="flex items-start gap-6 mb-8">
                <div className="p-4 bg-red-50 rounded-2xl shrink-0">
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-kitchen-text mb-3">Delete Recipe?</h3>
                  <p className="text-sm text-kitchen-muted leading-relaxed font-medium">
                    Are you sure you want to delete <span className="text-kitchen-text font-bold">"{recipe.title}"</span>? This action cannot be undone and all copies will lose their reference to this parent.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-6 py-3 text-xs font-bold text-kitchen-muted hover:text-kitchen-text transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-lg uppercase tracking-widest active:scale-95"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Permanently'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-stone-50 transition-all text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-kitchen-muted"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={14} className="md:w-[16px]" /> : <ChevronRight size={14} className="md:w-[16px]" />}
        <span>{isExpanded ? 'Hide' : 'Show'} Recipe Details</span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="recipe-details-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="border-t border-kitchen-border">
              <div className="p-4 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-kitchen-muted font-bold">Ingredients</h4>
                  {recipe.original_ingredients && (
                    <div className="flex gap-4 md:gap-6 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full" />
                        <span className="text-green-600">Added</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-kitchen-primary rounded-full" />
                        <span className="text-kitchen-primary">Modified</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="kitchen-table min-w-[300px]">
                    <thead>
                      <tr>
                        <th className="uppercase tracking-widest text-[9px] md:text-[10px]">Item</th>
                        <th className="uppercase tracking-widest text-[9px] md:text-[10px]">Qty</th>
                        <th className="uppercase tracking-widest text-[9px] md:text-[10px]">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients.map((ing, idx) => {
                        if (ing.isHeader) {
                          return (
                            <tr key={idx} className="bg-stone-50/50">
                              <td colSpan={3} className="py-2.5 md:py-4 px-4 md:px-6 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-kitchen-primary border-y border-kitchen-border">
                                {ing.item}
                              </td>
                            </tr>
                          );
                        }
                        const diff = getIngredientDiff(ing, idx);
                        const isNew = diff?.type === 'new';
                        const isChanged = diff?.type === 'changed';

                        return (
                          <tr key={idx} className={cn(
                            "transition-colors",
                            isNew && "bg-green-50/50",
                            isChanged && "bg-orange-50/50"
                          )}>
                            <td className="font-medium text-kitchen-text py-2.5 md:py-4 text-[13px] md:text-sm">
                              <div className="flex flex-col">
                                {isChanged && diff.fields?.includes('item') && (
                                  <span className="text-[8px] md:text-[10px] text-kitchen-muted line-through decoration-kitchen-primary/50 font-bold uppercase tracking-widest">
                                    {diff.original?.item}
                                  </span>
                                )}
                                <span className={cn(
                                  isNew && "text-green-600 font-bold",
                                  isChanged && diff.fields?.includes('item') && "text-kitchen-primary font-bold"
                                )}>
                                  {ing.item}
                                </span>
                              </div>
                            </td>
                            <td className="text-kitchen-muted py-2.5 md:py-4 font-medium text-[13px] md:text-sm">
                              <div className="flex flex-col">
                                {isChanged && diff.fields?.includes('amount') && (
                                  <span className="text-[8px] md:text-[10px] text-kitchen-muted line-through decoration-kitchen-primary/50 font-bold uppercase tracking-widest">
                                    {diff.original?.amount}
                                  </span>
                                )}
                                <span className={cn(
                                  isChanged && diff.fields?.includes('amount') && "text-kitchen-primary font-bold"
                                )}>
                                  {ing.amount}
                                </span>
                              </div>
                            </td>
                            <td className="text-kitchen-muted py-2.5 md:py-4 font-medium text-[13px] md:text-sm">
                              <div className="flex flex-col">
                                {isChanged && diff.fields?.includes('unit') && (
                                  <span className="text-[8px] md:text-[10px] text-kitchen-muted line-through decoration-kitchen-primary/50 font-bold uppercase tracking-widest">
                                    {diff.original?.unit}
                                  </span>
                                )}
                                <span className={cn(
                                  isChanged && diff.fields?.includes('unit') && "text-kitchen-primary font-bold"
                                )}>
                                  {ing.unit}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 md:p-8 bg-stone-50/30">
                <div className="mb-6 md:mb-8">
                  <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-kitchen-muted font-bold">Preparation Steps</h4>
                </div>
                <ol className="space-y-6 md:space-y-10">
                  {recipe.steps.map((step, idx) => {
                    const isSection = step !== null && typeof step === 'object' ? (step as Step).isSubheading : String(step || '').startsWith('[SECTION]:');
                    const text = (step !== null && typeof step === 'object') ? (step as Step).text : (isSection ? String(step || '').replace('[SECTION]:', '').trim() : (step as string || ''));
                    
                    if (isSection) {
                      return (
                        <li key={idx} className="pt-4 md:pt-8 first:pt-0">
                          <h5 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-kitchen-primary mb-3 md:mb-4 border-b border-kitchen-border pb-2 md:pb-3">
                            {text}
                          </h5>
                        </li>
                      );
                    }

                    const diff = getStepDiff(typeof step === 'string' ? step : step.text, idx);
                    const isNew = diff?.type === 'new';
                    const isChanged = diff?.type === 'changed';

                    return (
                      <li key={idx} className={cn(
                        "flex gap-4 md:gap-6 text-[13px] md:text-sm p-4 md:p-6 -mx-2 md:-mx-4 rounded-2xl md:rounded-3xl transition-all border",
                        isNew && "bg-green-50/50 border-green-200 border-l-[6px] md:border-l-8 border-l-green-500",
                        isChanged && "bg-orange-50/50 border-orange-200 border-l-[6px] md:border-l-8 border-l-kitchen-primary",
                        !isNew && !isChanged && "bg-white border-kitchen-border hover:border-kitchen-primary hover:shadow-md"
                      )}>
                        <span className={cn(
                          "font-serif font-bold text-2xl md:text-3xl shrink-0 leading-none",
                          isNew ? "text-green-600" : isChanged ? "text-kitchen-primary" : "text-stone-200"
                        )}>
                          {idx + 1}.
                        </span>
                        <div className="space-y-2 md:space-y-3">
                          {isChanged && (
                            <p className="text-[8px] md:text-[10px] text-kitchen-muted line-through decoration-kitchen-primary/50 leading-relaxed italic font-bold uppercase tracking-widest">
                              {diff.original}
                            </p>
                          )}
                          <p className={cn(
                            "leading-relaxed font-medium break-words",
                            isNew ? "text-green-700 font-bold" : isChanged ? "text-kitchen-text font-bold" : "text-kitchen-text"
                          )}>
                            {text}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {(recipe.equipment?.length || recipe.keywords?.length || recipe.notes) && (
                <div className="p-4 md:p-8 border-t border-kitchen-border space-y-8 md:space-y-10">
                  {recipe.equipment && recipe.equipment.length > 0 && (
                    <div className="space-y-3 md:space-y-4">
                      <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-kitchen-muted font-bold">Kitchen Tools</h4>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {recipe.equipment.map((item, i) => (
                          <span key={i} className="bg-stone-100 text-kitchen-text text-[9px] md:text-[10px] font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-kitchen-border uppercase tracking-widest leading-none">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.keywords && recipe.keywords.length > 0 && (
                    <div className="space-y-3 md:space-y-4">
                      <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-kitchen-muted font-bold">Tags</h4>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {recipe.keywords.map((tag, i) => (
                          <span key={i} className="text-kitchen-primary text-[10px] md:text-[11px] font-bold hover:underline cursor-pointer uppercase tracking-widest bg-orange-50 px-2 md:px-3 py-0.5 md:py-1 rounded-md md:rounded-lg border border-orange-100 leading-none">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.notes && (
                    <div className="space-y-3 md:space-y-4">
                      <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-kitchen-muted font-bold">Chef's Notes</h4>
                      <div className="bg-stone-50 border-l-[6px] md:border-l-8 border-kitchen-primary p-4 md:p-6 rounded-r-2xl md:rounded-r-3xl">
                        <p className="text-[13px] md:text-sm text-kitchen-text leading-relaxed whitespace-pre-wrap italic font-medium">
                          {recipe.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {childForks.length > 0 && (
                <div className="p-4 md:p-8 border-t border-kitchen-border bg-stone-50/20">
                  <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-kitchen-muted font-bold mb-4 md:mb-6">Community Tweaks</h4>
                  <div className="grid gap-3 md:gap-4">
                    {childForks.map(fork => (
                      <button
                        key={fork.id}
                        onClick={() => scrollToRecipe(fork.id)}
                        className="flex items-center justify-between p-4 md:p-5 text-[13px] md:text-sm bg-white border border-kitchen-border rounded-xl md:rounded-2xl hover:border-kitchen-primary hover:shadow-xl transition-all group active:scale-[0.98] text-left"
                      >
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                          <GitFork size={16} className="text-kitchen-primary shrink-0" />
                          <span className="font-bold text-kitchen-muted uppercase tracking-widest text-[10px] md:text-[11px] truncate">
                            @{fork.user_id.slice(0, 8)} / <span className="font-serif font-bold text-kitchen-text text-sm md:text-base normal-case tracking-normal">{fork.title}</span>
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-stone-300 group-hover:text-kitchen-primary transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
