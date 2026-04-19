import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { cn } from '../lib/utils';
import { Plus, Database, GitBranch, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
      } else if (activeTab === 'favorites') {
        setTotalCount(starredRecipeIds.size);
      }
    };
    fetchCount();
  }, [activeTab, user?.uid, starredRecipeIds.size]);

  const loadRecipes = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      
      // If favorites, use getRecipesByIds
      if (activeTab === 'favorites') {
        const ids = Array.from(starredRecipeIds);
        if (ids.length === 0) {
          setRecipes([]);
          setHasMore(false);
          return;
        }
        const result = await getRecipesByIds(ids);
        setRecipes(result);
        setHasMore(false); // No pagination for favorites yet
        return;
      }

      const filters: any = {};
      if (activeTab === 'mine' && user) {
        filters.userId = user.uid;
      }
      
      const result = await getRecipesPaginated(
        ITEMS_PER_PAGE,
        reset ? null : lastVisible,
        filters
      );

      let updatedRecipes: Recipe[] = [];
      if (reset) {
        updatedRecipes = result.recipes;
      } else {
        // Avoid duplicates
        setRecipes(prev => {
          const newRecipes = result.recipes.filter(nr => !prev.some(pr => pr.id === nr.id));
          updatedRecipes = [...prev, ...newRecipes];
          return updatedRecipes;
        });
      }
      
      if (reset) setRecipes(updatedRecipes);
      
      setLastVisible(result.lastVisible);
      setHasMore(result.hasMore);
      
      // Update tab cache
      setTabCache(activeTab, {
        recipes: reset ? result.recipes : updatedRecipes,
        lastVisible: result.lastVisible,
        hasMore: result.hasMore
      });
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user?.uid, lastVisible, starredRecipeIds, recipes]);

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
            <GitBranch size={16} className="text-kitchen-primary" />
            <span>{totalCount} {totalCount === 1 ? 'recipe' : 'recipes'}</span>
          </div>
          <div className="h-4 w-[1px] bg-kitchen-border" />
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-kitchen-primary" />
            <span>All branches</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-10 h-10 border-4 border-kitchen-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-kitchen-muted uppercase tracking-widest">Opening recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="border-2 border-dashed border-stone-200 rounded-3xl p-16 text-center space-y-6 bg-stone-50/30">
          <div className="flex justify-center">
            <Database size={64} className="text-stone-200" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-serif font-bold text-kitchen-text">Recipes collection is empty</h3>
            <p className="text-kitchen-muted max-w-sm mx-auto font-medium">
              Start by creating a new recipe, importing from a URL, or seed the database with a starter recipe.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
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
        <div className="border-2 border-dashed border-stone-200 rounded-3xl p-16 text-center bg-stone-50/30">
          {searchQuery ? (
            <div className="space-y-4">
              <p className="text-kitchen-muted font-medium">No recipes found matching <span className="text-kitchen-text font-bold">"{searchQuery}"</span>.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-kitchen-primary font-bold hover:underline text-sm uppercase tracking-widest"
              >
                Clear search
              </button>
            </div>
          ) : activeTab === 'mine' ? (
            <div className="space-y-4">
              <p className="text-kitchen-muted font-medium">You haven't created or tweaked any recipes yet.</p>
              <button
                onClick={handleCreate}
                className="text-kitchen-primary font-bold hover:underline text-sm uppercase tracking-widest"
              >
                Create your first recipe
              </button>
            </div>
          ) : activeTab === 'favorites' ? (
            <p className="text-kitchen-muted font-medium">You haven't starred any recipes yet.</p>
          ) : (
            <p className="text-kitchen-muted font-medium">No recipes found.</p>
          )}
        </div>
      )}
    </div>
  );
}
