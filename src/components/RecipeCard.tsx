import { GitFork, Edit2, ChevronRight, ChevronDown, Star, Globe, Lock, ExternalLink, Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import { cn } from '../lib/utils';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

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
  onUserClick
}) => {
  const [isExpanded, setIsExpanded] = useState(expandedDefault);
  const [parentRecipe, setParentRecipe] = useState<Recipe | null>(null);
  const [forkCount, setForkCount] = useState(0);
  const [childForks, setChildForks] = useState<Recipe[]>([]);
  const [starCount, setStarCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    console.log(`RecipeCard mounted for: ${recipe.title}`, {
      hasOriginalIngredients: !!recipe.original_ingredients,
      originalIngredientsCount: recipe.original_ingredients?.length,
      hasOriginalSteps: !!recipe.original_steps,
      originalStepsCount: recipe.original_steps?.length,
      parentId: recipe.parent_id
    });

    if (recipe.parent_id) {
      fetchParent();
    }
    
    // Real-time fork count
    const forksQuery = query(collection(db, 'recipes'), where('parent_id', '==', recipe.id));
    const unsubscribeForks = onSnapshot(forksQuery, (snapshot) => {
      setForkCount(snapshot.size);
      const fetchedForks = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Recipe));
      const uniqueForks = fetchedForks.filter((recipe, index, self) =>
        index === self.findIndex((t) => t.id === recipe.id)
      );
      setChildForks(uniqueForks.slice(0, 5));
    });

    // Real-time stars
    const starsQuery = query(collection(db, 'stars'), where('recipe_id', '==', recipe.id));
    const unsubscribeStars = onSnapshot(starsQuery, (snapshot) => {
      setStarCount(snapshot.size);
    });

    return () => {
      unsubscribeForks();
      unsubscribeStars();
    };
  }, [recipe.parent_id, recipe.id, auth.currentUser]);

  const fetchParent = async () => {
    try {
      const parentDoc = await getDoc(doc(db, 'recipes', recipe.parent_id!));
      if (parentDoc.exists()) {
        setParentRecipe({ id: parentDoc.id, ...parentDoc.data() } as Recipe);
      }
    } catch (error) {
      console.error('Error fetching parent recipe:', error);
    }
  };

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
      if (isStarred) {
        console.log('Removing star...');
        await deleteDoc(starRef);
      } else {
        console.log('Adding star...');
        await setDoc(starRef, {
          recipe_id: recipe.id,
          user_id: user.uid,
          created_at: new Date().toISOString()
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
        console.error('Detailed Permission Error:', JSON.stringify(errInfo, null, 2));
      }
    }
  };

  const scrollToRecipe = (id: string) => {
    const element = document.getElementById(`recipe-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Briefly highlight
      element.classList.add('ring-2', 'ring-carbon-blue-60');
      setTimeout(() => element.classList.remove('ring-2', 'ring-carbon-blue-60'), 2000);
    } else {
      navigate(`/recipe/${id}`);
    }
  };

  const getIngredientDiff = (ing: Ingredient, idx: number) => {
    // If we have a parent_id but parentRecipe hasn't loaded yet, 
    // we should wait to show diffs to avoid "everything is new" flicker
    if (recipe.parent_id && !parentRecipe) return null;

    const baseIngredients = parentRecipe?.ingredients || recipe.original_ingredients;
    
    if (!baseIngredients || baseIngredients.length === 0) {
      return null;
    }

    // Use index-based comparison to track name changes
    const originalIng = baseIngredients[idx];
    
    if (!originalIng) return { type: 'new' };
    
    const changes: string[] = [];
    if (originalIng.item.trim().toLowerCase() !== ing.item.trim().toLowerCase()) changes.push('item');
    if (originalIng.amount.trim() !== ing.amount.trim()) changes.push('amount');
    if (originalIng.unit.trim() !== ing.unit.trim()) changes.push('unit');
    
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

  const getStepDiff = (step: string, idx: number) => {
    if (recipe.parent_id && !parentRecipe) return null;

    const baseSteps = parentRecipe?.steps || recipe.original_steps;
    if (!baseSteps || baseSteps.length === 0) return null;

    // Simple index-based comparison for steps
    const originalStep = baseSteps[idx];
    
    if (originalStep === undefined) return { type: 'new' };
    if (originalStep.trim() !== step.trim()) {
      return { type: 'changed', original: originalStep };
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
    <div id={`recipe-${recipe.id}`} className="bg-carbon-gray-90 border border-carbon-gray-80 overflow-hidden transition-all duration-500">
      {/* Repo Header Style */}
      <div className="p-4 border-b border-carbon-gray-80 bg-carbon-gray-100/30">
        <div className="flex flex-col gap-3 md:gap-2">
          {/* Line 1: Actions & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-sm border border-carbon-gray-80 text-[7px] text-carbon-gray-30 uppercase tracking-[0.2em] bg-carbon-gray-100/50">
                Public
              </span>
              {recipe.parent_id && (
                <div className="flex items-center gap-1 text-[7px] uppercase font-mono text-yellow-500 border border-yellow-500/20 px-1 py-0.5 rounded-sm bg-yellow-500/5">
                  <div className="w-1 h-1 bg-yellow-500" />
                  <span>Forked</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFork(recipe);
                }}
                className="flex items-center gap-1 bg-carbon-gray-80 hover:bg-carbon-gray-70 text-white px-2 py-1 md:px-1.5 md:py-0.5 text-[9px] md:text-[8px] font-medium border border-carbon-gray-80 transition-colors rounded-sm"
              >
                <GitFork size={10} />
                Fork
              </button>
              
              {isOwner && (
                <>
                  <button
                    onClick={() => onEdit(recipe)}
                    className="flex items-center gap-1 bg-carbon-gray-80 hover:bg-carbon-gray-70 text-white px-2 py-1 md:px-1.5 md:py-0.5 text-[9px] md:text-[8px] font-medium border border-carbon-gray-80 transition-colors rounded-sm"
                  >
                    <Edit2 size={10} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 px-2 py-1 md:px-1.5 md:py-0.5 text-[9px] md:text-[8px] font-medium border border-red-900/50 transition-colors rounded-sm"
                  >
                    <Trash2 size={10} />
                    Del
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Line 2: Identity & Date */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-mono min-w-0">
              <span 
                onClick={() => onUserClick?.(recipe.user_id)}
                className="text-carbon-blue-60 hover:underline cursor-pointer shrink-0"
              >
                {userHandle}
              </span>
              <span className="text-carbon-gray-80 shrink-0">/</span>
              <Link 
                to={`/recipe/${recipe.id}`}
                className="text-white font-bold hover:underline cursor-pointer truncate"
              >
                {recipe.title}
              </Link>
            </div>
            
            <div className="text-[9px] md:text-[10px] font-mono text-carbon-gray-40 shrink-0">
              Updated <span className="text-carbon-gray-30">{formatUpdateDate(recipe.updated_at || recipe.created_at)}</span>
            </div>
          </div>

          {/* Line 3: Stats & Source */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 pt-0.5">
            <div className="flex flex-wrap items-center gap-3 text-[9px] md:text-[10px] font-mono text-carbon-gray-40">
              <button 
                onClick={handleStarToggle}
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  isStarred ? "text-yellow-500" : "hover:text-carbon-blue-60"
                )}
              >
                <Star size={10} fill={isStarred ? "currentColor" : "none"} />
                <span>{starCount} stars</span>
              </button>
              
              <div className="flex items-center gap-1 hover:text-carbon-blue-60 cursor-pointer">
                <GitFork size={10} />
                <span>{forkCount} forks</span>
              </div>

              {recipe.parent_id && (
                <button 
                  onClick={() => scrollToRecipe(recipe.parent_id!)}
                  className="flex items-center gap-1 text-carbon-blue-60 hover:underline"
                >
                  <GitFork size={10} className="rotate-180" />
                  <span>from {recipe.parent_id.slice(0, 8)}</span>
                </button>
              )}
            </div>

            {recipe.source_url && (
              <a 
                href={recipe.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] md:text-[10px] font-mono text-carbon-gray-40 hover:text-carbon-blue-60 transition-colors truncate max-w-full md:max-w-[200px]"
              >
                <ExternalLink size={10} />
                <span>{new URL(recipe.source_url).hostname}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Bar */}
      {(recipe.prep_time || recipe.cook_time || recipe.servings || recipe.cuisine || recipe.course) && (
        <div className="px-4 py-3 bg-carbon-gray-100/20 border-b border-carbon-gray-80 grid grid-cols-2 md:grid-cols-5 gap-4">
          {recipe.prep_time && (
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-carbon-gray-40 font-mono">Prep Time</span>
              <p className="text-xs text-white font-mono">{recipe.prep_time}</p>
            </div>
          )}
          {recipe.cook_time && (
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-carbon-gray-40 font-mono">Cook Time</span>
              <p className="text-xs text-white font-mono">{recipe.cook_time}</p>
            </div>
          )}
          {recipe.servings && (
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-carbon-gray-40 font-mono">Servings</span>
              <p className="text-xs text-white font-mono">{recipe.servings}</p>
            </div>
          )}
          {recipe.cuisine && (
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-carbon-gray-40 font-mono">Cuisine</span>
              <p className="text-xs text-white font-mono">{recipe.cuisine}</p>
            </div>
          )}
          {recipe.course && (
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-carbon-gray-40 font-mono">Course</span>
              <p className="text-xs text-white font-mono">{recipe.course}</p>
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              key="delete-confirm-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-carbon-gray-90 border border-carbon-gray-80 w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-900/20 rounded-full shrink-0">
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Delete Recipe?</h3>
                  <p className="text-sm text-carbon-gray-30">
                    Are you sure you want to delete <span className="text-white font-bold">"{recipe.title}"</span>? This action cannot be undone and all forks will lose their reference to this parent.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-carbon-gray-30 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white px-6 py-2 text-sm font-medium transition-colors rounded-sm"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
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
        className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-carbon-gray-80 transition-colors text-xs text-carbon-gray-30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{isExpanded ? 'Hide' : 'Show'} details</span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="recipe-details-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-carbon-gray-80">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-wider text-carbon-gray-30 font-semibold">Ingredients</h4>
                  {(parentRecipe || recipe.original_ingredients) && (
                    <div className="flex gap-3 text-[10px] uppercase font-mono">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#24A148]" />
                        <span>Added</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#8A3FFC]" />
                        <span>Modified</span>
                      </div>
                    </div>
                  )}
                </div>
                <table className="carbon-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Amount</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.ingredients.map((ing, idx) => {
                      if (ing.isHeader) {
                        return (
                          <tr key={idx} className="bg-carbon-gray-100/50">
                            <td colSpan={3} className="py-2 px-4 text-[10px] font-bold uppercase tracking-widest text-carbon-blue-60 border-y border-carbon-gray-80">
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
                          isNew && "bg-[#24A148]/10",
                          isChanged && "bg-[#8A3FFC]/10"
                        )}>
                          <td className="font-mono">
                            <div className="flex flex-col">
                              {isChanged && diff.fields?.includes('item') && (
                                <span className="text-[10px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50">
                                  {diff.original?.item}
                                </span>
                              )}
                              <span className={cn(
                                isNew && "text-[#24A148] font-bold",
                                isChanged && diff.fields?.includes('item') && "text-[#8A3FFC] font-bold"
                              )}>
                                {ing.item}
                              </span>
                            </div>
                          </td>
                          <td className="font-mono">
                            <div className="flex flex-col">
                              {isChanged && diff.fields?.includes('amount') && (
                                <span className="text-[10px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50">
                                  {diff.original?.amount}
                                </span>
                              )}
                              <span className={cn(
                                isChanged && diff.fields?.includes('amount') && "text-[#8A3FFC] font-bold"
                              )}>
                                {ing.amount}
                              </span>
                            </div>
                          </td>
                          <td className="font-mono">
                            <div className="flex flex-col">
                              {isChanged && diff.fields?.includes('unit') && (
                                <span className="text-[10px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50">
                                  {diff.original?.unit}
                                </span>
                              )}
                              <span className={cn(
                                isChanged && diff.fields?.includes('unit') && "text-[#8A3FFC] font-bold"
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

              <div className="p-4 bg-carbon-gray-100/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-wider text-carbon-gray-30 font-semibold">Steps</h4>
                </div>
                <ol className="space-y-4">
                  {recipe.steps.map((step, idx) => {
                    const isSection = step.startsWith('[SECTION]:');
                    const text = isSection ? step.replace('[SECTION]:', '').trim() : step;
                    
                    if (isSection) {
                      return (
                        <li key={idx} className="pt-4 first:pt-0">
                          <h5 className="text-[10px] font-bold uppercase tracking-widest text-carbon-blue-60 mb-2 border-b border-carbon-gray-80 pb-1">
                            {text}
                          </h5>
                        </li>
                      );
                    }

                    const diff = getStepDiff(step, idx);
                    const isNew = diff?.type === 'new';
                    const isChanged = diff?.type === 'changed';

                    return (
                      <li key={idx} className={cn(
                        "flex gap-4 text-sm p-2 -mx-2 transition-colors",
                        isNew && "bg-[#24A148]/10 border-l-2 border-[#24A148]",
                        isChanged && "bg-[#8A3FFC]/10 border-l-2 border-[#8A3FFC]"
                      )}>
                        <span className={cn(
                          "font-mono font-bold shrink-0",
                          isNew ? "text-[#24A148]" : isChanged ? "text-[#8A3FFC]" : "text-carbon-blue-60"
                        )}>
                          {idx + 1}.
                        </span>
                        <div className="space-y-1">
                          {isChanged && (
                            <p className="text-[11px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50 leading-relaxed italic">
                              {diff.original}
                            </p>
                          )}
                          <p className={cn(
                            "leading-relaxed",
                            isNew ? "text-[#24A148] font-medium" : isChanged ? "text-white font-medium" : "text-carbon-gray-30"
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
                <div className="p-4 border-t border-carbon-gray-80 space-y-6">
                  {recipe.equipment && recipe.equipment.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Equipment Needed</h4>
                      <div className="flex flex-wrap gap-2">
                        {recipe.equipment.map((item, i) => (
                          <span key={i} className="bg-carbon-gray-80 text-[10px] font-mono px-2 py-1 rounded-sm border border-carbon-gray-70">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.keywords && recipe.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {recipe.keywords.map((tag, i) => (
                          <span key={i} className="text-carbon-blue-60 text-[10px] font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.notes && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Chef's Notes</h4>
                      <div className="bg-carbon-gray-100/50 border-l-2 border-carbon-blue-60 p-3">
                        <p className="text-xs text-carbon-gray-30 leading-relaxed whitespace-pre-wrap">
                          {recipe.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {childForks.length > 0 && (
                <div className="p-4 border-t border-carbon-gray-80 bg-carbon-gray-100/20">
                  <h4 className="text-xs uppercase tracking-wider text-carbon-gray-30 font-semibold mb-3">Active Forks</h4>
                  <div className="grid gap-2">
                    {childForks.map(fork => (
                      <button
                        key={fork.id}
                        onClick={() => scrollToRecipe(fork.id)}
                        className="flex items-center justify-between p-2 text-xs bg-carbon-gray-100 border border-carbon-gray-80 hover:border-carbon-blue-60 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <GitFork size={12} className="text-carbon-blue-60" />
                          <span className="font-mono text-white">{fork.user_id.slice(0, 8)} / {fork.title}</span>
                        </div>
                        <ChevronRight size={12} className="text-carbon-gray-30 group-hover:text-white" />
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
}
