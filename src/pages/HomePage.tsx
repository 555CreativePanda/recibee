import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { cn } from '../lib/utils';
import { Plus, Database, Filter, ChevronLeft, ChevronRight, Loader2, ChefHat } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import { getRecipesPaginated, getRecipesByIds, getTabCache, setTabCache, getRecipesCount } from '../services/recipeService';

interface HomePageProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'all' | 'mine' | 'favorites';
  setActiveTab: (tab: 'all' | 'mine' | 'favorites') => void;
  starredRecipeIds: Set<string>;
  handleCreate: () => void;
  handleSeed: () => void;
  handleFork: (recipe: Recipe) => void;
  setEditingRecipe: (recipe: Recipe) => void;
  ensureAuth: (action: string) => boolean;
  user: any;
  onUserClick?: (uid: string) => void;
}

export function HomePage({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  starredRecipeIds,
  handleCreate,
  handleSeed,
  handleFork,
  setEditingRecipe,
  ensureAuth,
  user,
  onUserClick
}: HomePageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const ITEMS_PER_PAGE = 10;
  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchCount = async () => {
      if (activeTab === 'all') {
        const count = await getRecipesCount();
        setTotalCount(count);
      } else if (activeTab === 'mine' && user) {
        const count = await getRecipesCount({ userId: user.uid });
        setTotalCount(count);
      } else if (activeTab === 'favorites' && user) {
        setTotalCount(starredRecipeIds.size);
      } else {
        setTotalCount(0);
      }
    };
    fetchCount();
  }, [activeTab, user?.uid, starredRecipeIds.size]);

  const loadRecipes = useCallback(async (reset = false) => {
    // If we are on a tab that requires auth and we don't have a user, just stop
    if ((activeTab === 'mine' || activeTab === 'favorites') && !user) {
      console.log(`[HomePage] ${activeTab} tab selected but user not logged in. Showing empty state.`);
      setRecipes([]);
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log(`[HomePage] Loading recipes for tab: ${activeTab}, user: ${user?.uid}, reset: ${reset}`);
      // @ts-ignore - access internal databaseId for debugging
      console.log(`[HomePage] Using Database ID:`, db._databaseId?.database || '(default)');
      
      // If favorites, use getRecipesByIds
      if (activeTab === 'favorites') {
        const ids = Array.from(starredRecipeIds);
        console.log(`[HomePage] Fetching favorites for ${ids.length} IDs`);
        if (ids.length === 0) {
          setRecipes([]);
          setHasMore(false);
          return;
        }
        const result = await getRecipesByIds(ids);
        console.log(`[HomePage] Fetched ${result.length} favorites`);
        setRecipes(result);
        setHasMore(false); // No pagination for favorites yet
        return;
      }

      const filters: any = {};
      if (activeTab === 'mine' && user) {
        filters.userId = user.uid;
      }
      
      console.log(`[HomePage] Fetching paginated with filters:`, filters);
      const result = await getRecipesPaginated(
        ITEMS_PER_PAGE,
        reset ? null : lastVisible,
        filters
      );
      console.log(`[HomePage] Fetched ${result.recipes.length} recipes, hasMore: ${result.hasMore}`);

      if (reset) {
        setRecipes(result.recipes);
      } else {
        // Avoid duplicates
        setRecipes(prev => {
          const newRecipes = result.recipes.filter(nr => !prev.some(pr => pr.id === nr.id));
          const updated = [...prev, ...newRecipes];
          
          setTabCache(activeTab, {
            recipes: updated,
            lastVisible: result.lastVisible,
            hasMore: result.hasMore
          });
          
          return updated;
        });
      }
      
      if (reset) {
        setHasMore(result.hasMore);
        setLastVisible(result.lastVisible);
        
        setTabCache(activeTab, {
          recipes: result.recipes,
          lastVisible: result.lastVisible,
          hasMore: result.hasMore
        });
      } else {
        setHasMore(result.hasMore);
        setLastVisible(result.lastVisible);
      }
    } catch (err: any) {
      console.error('[HomePage] Error loading recipes:', err);
      setError(err?.message || 'Failed to load recipes. Please check your configuration.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user?.uid, lastVisible, starredRecipeIds]);

  useEffect(() => {
    // Check cache first
    const cached = getTabCache(activeTab);
    if (cached && activeTab !== 'favorites') {
      setRecipes(cached.recipes);
      setLastVisible(cached.lastVisible);
      setHasMore(cached.hasMore);
      setIsLoading(false);
      return;
    }
    
    // Clear current recipes before loading new ones if switching tabs
    setRecipes([]);
    setLastVisible(null);
    setHasMore(true);
    setCurrentPage(1);
    
    loadRecipes(true);
  }, [activeTab, user?.uid]); // Use user?.uid for stability

  const filteredRecipes = recipes.filter(r => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      r.title.toLowerCase().includes(searchLower) ||
      r.cuisine?.toLowerCase().includes(searchLower) ||
      r.keywords?.some(k => k.toLowerCase().includes(searchLower));
      
    let matchesTab = true;
    if (activeTab === 'favorites') {
      matchesTab = starredRecipeIds.has(r.id);
    }
    // 'mine' is handled by server-side filter in loadRecipes
    
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE);
  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleDelete = (recipeId: string) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    setTotalCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
    
    // Also update tab cache
    const cached = getTabCache(activeTab);
    if (cached) {
      setTabCache(activeTab, {
        ...cached,
        recipes: cached.recipes.filter(r => r.id !== recipeId)
      });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleNext = async () => {
    const isAtEndOfLocal = currentPage * ITEMS_PER_PAGE >= filteredRecipes.length;
    
    if (isAtEndOfLocal && hasMore) {
      await loadRecipes();
    }
    
    if (currentPage * ITEMS_PER_PAGE < filteredRecipes.length || (isAtEndOfLocal && hasMore)) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <SEO 
        title="Explore Recipes" 
        description="Browse the global ReciBee recipe box. Find, tweak, and star the best recipes from around the world."
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b border-kitchen-border gap-4">
        <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar -mb-[1px]">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
              activeTab === 'all' ? "text-kitchen-primary" : "text-kitchen-muted hover:text-kitchen-text"
            )}
          >
            All Recipes
            {activeTab === 'all' && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-kitchen-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={cn(
              "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
              activeTab === 'mine' ? "text-kitchen-primary" : "text-kitchen-muted hover:text-kitchen-text"
            )}
          >
            My Recipes
            {activeTab === 'mine' && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-kitchen-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
              activeTab === 'favorites' ? "text-kitchen-primary" : "text-kitchen-muted hover:text-kitchen-text"
            )}
          >
            Starred
            {activeTab === 'favorites' && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-kitchen-primary rounded-t-full" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs md:text-sm text-kitchen-muted font-bold uppercase tracking-widest pb-4">
          <div className="flex items-center gap-2">
            <ChefHat size={16} className="text-kitchen-primary" />
            {totalCount === null ? (
              <div className="w-8 h-4 bg-stone-100 animate-pulse rounded" />
            ) : (
              <span>{totalCount} {totalCount === 1 ? 'recipe' : 'recipes'}</span>
            )}
          </div>
          <div className="h-4 w-[1px] bg-kitchen-border" />
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-kitchen-primary" />
            <span>All Versions</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-10 h-10 border-4 border-kitchen-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-kitchen-muted uppercase tracking-widest">Opening recipes...</p>
        </div>
      ) : error ? (
        <div className="border-2 border-red-100 rounded-3xl p-16 text-center space-y-6 bg-red-50/20">
          <div className="flex justify-center">
            <Loader2 size={64} className="text-red-200" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-serif font-bold text-red-900 text-kitchen-text">Connection Issue</h3>
            <p className="text-red-600 max-w-sm mx-auto font-medium">
              {error}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={() => loadRecipes(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-kitchen-primary hover:bg-orange-700 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (recipes.length === 0 || ((activeTab === 'mine' || activeTab === 'favorites') && !user)) ? (
        <div className="border-2 border-dashed border-stone-200 rounded-3xl p-16 text-center space-y-6 bg-stone-50/30">
          <div className="flex justify-center">
            <Database size={64} className="text-stone-200" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-serif font-bold text-kitchen-text">
              {((activeTab === 'mine' || activeTab === 'favorites') && !user) 
                ? "Login required" 
                : "Recipes collection is empty"}
            </h3>
            <p className="text-kitchen-muted max-w-sm mx-auto font-medium leading-relaxed">
              {activeTab === 'mine' && !user ? (
                "Create your own digital recipe box. Login or create an account to start importing and tweaking recipes."
              ) : activeTab === 'favorites' && !user ? (
                "Save your favorite recipes here. Login or create an account to start building your collection."
              ) : (
                "Start by creating a new recipe, importing from a URL, or seed the database with a starter recipe."
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            {!user && (activeTab === 'mine' || activeTab === 'favorites') ? (
              <button
                onClick={() => ensureAuth(activeTab === 'mine' ? 'manage your recipes' : 'view your favorites')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-kitchen-primary hover:bg-orange-700 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 uppercase tracking-widest active:scale-95"
              >
                Login or create an account
              </button>
            ) : (
              <>
                <button
                  onClick={handleCreate}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-kitchen-primary hover:bg-orange-700 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 uppercase tracking-widest"
                >
                  <Plus size={20} />
                  New Recipe
                </button>
                <button
                  onClick={handleSeed}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white border border-kitchen-border hover:bg-stone-50 text-kitchen-text px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-sm uppercase tracking-widest"
                >
                  <Database size={20} />
                  Seed Starter
                </button>
              </>
            )}
          </div>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="space-y-10">
          <div className="grid gap-6">
            {paginatedRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFork={handleFork}
                onEdit={(r) => setEditingRecipe(r)}
                onRequireAuth={ensureAuth}
                isOwner={user ? recipe.user_id === user.uid : false}
                isStarred={starredRecipeIds.has(recipe.id)}
                user={user}
                onUserClick={onUserClick}
                onDelete={handleDelete}
                allRecipes={recipes}
              />
            ))}
          </div>

          {(totalPages > 1 || hasMore) && (
            <div className="flex items-center justify-center gap-12 py-12 border-t border-kitchen-border">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="group flex items-center gap-3 px-8 py-4 bg-white border border-kitchen-border rounded-2xl text-sm font-bold text-kitchen-muted hover:text-kitchen-primary hover:border-kitchen-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-[0.2em]"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Previous
              </button>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-kitchen-muted uppercase tracking-[0.3em]">Page</span>
                <span className="text-xl font-serif font-bold text-kitchen-text">{currentPage}</span>
              </div>

              <button
                onClick={handleNext}
                disabled={(currentPage >= totalPages && !hasMore) || isLoading}
                className="group flex items-center gap-3 px-8 py-4 bg-white border border-kitchen-border rounded-2xl text-sm font-bold text-kitchen-primary hover:bg-kitchen-primary hover:text-white hover:border-kitchen-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-[0.2em] shadow-sm hover:shadow-lg hover:shadow-orange-100"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Next
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white border border-kitchen-border rounded-3xl shadow-sm">
          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-8 border border-stone-100">
            <ChefHat size={40} className="text-stone-300" />
          </div>
          
          {searchQuery ? (
            <div className="text-center max-w-sm space-y-4">
              <h3 className="text-xl font-serif font-bold text-kitchen-text">No matches found</h3>
              <p className="text-kitchen-muted text-sm leading-relaxed">
                We couldn't find any recipes matching <span className="font-bold text-kitchen-text">"{searchQuery}"</span>. Try adjusting your search keywords.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-2.5 bg-kitchen-primary hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                Clear Search
              </button>
            </div>
          ) : activeTab === 'mine' ? (
            <div className="text-center max-w-sm space-y-4">
              <h3 className="text-xl font-serif font-bold text-kitchen-text">Your Recipe Box is Empty</h3>
              <p className="text-kitchen-muted text-sm leading-relaxed">
                {user 
                  ? "It's time to start your collection! Click the button below to add your first recipe." 
                  : "Sign in to start creating and saving your own personal collection of recipes."}
              </p>
              <button
                onClick={() => user ? handleCreate() : ensureAuth('create recipes')}
                className="mt-4 px-8 py-3 bg-kitchen-primary hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                {user ? "Create First Recipe" : "Login to Start"}
              </button>
            </div>
          ) : activeTab === 'favorites' ? (
            <div className="text-center max-w-sm space-y-4">
              <h3 className="text-xl font-serif font-bold text-kitchen-text">No Favorites Yet</h3>
              <p className="text-kitchen-muted text-sm leading-relaxed">
                {user 
                  ? "Star your favorite recipes to keep them here for quick access later." 
                  : "Sign in to star recipes and build your personal favorites list."}
              </p>
              <button
                onClick={() => setActiveTab('all')}
                className="mt-4 px-8 py-3 bg-kitchen-primary hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                Explore Recipes
              </button>
            </div>
          ) : (
            <div className="text-center max-w-sm space-y-4">
              <h3 className="text-xl font-serif font-bold text-kitchen-text">Exploring the Library</h3>
              <p className="text-kitchen-muted text-sm leading-relaxed">
                The recipe box is currently quiet. If you're the owner, you may need to re-sync your metadata to make existing recipes visible.
              </p>
              {user && user.email === 'chandra.mayur@gmail.com' && (
                <button
                  onClick={async () => {
                    const { healRecipes } = await import('../services/recipeService');
                    const repaired = await healRecipes();
                    alert(`Data repair successful! Repaired ${repaired} recipes. The page will now refresh.`);
                    window.location.reload();
                  }}
                  className="mt-4 px-8 py-3 bg-kitchen-primary hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                >
                  Repair Data Links
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
