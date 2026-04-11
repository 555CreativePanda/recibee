import { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { cn } from '../lib/utils';
import { Plus, Database, GitBranch, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

interface HomePageProps {
  recipes: Recipe[];
  isLoading: boolean;
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
}

export function HomePage({
  recipes,
  isLoading,
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
  user
}: HomePageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesTab = true;
    if (activeTab === 'favorites') {
      matchesTab = starredRecipeIds.has(r.id);
    } else if (activeTab === 'mine') {
      matchesTab = user ? r.user_id === user.uid : false;
    }
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

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 7; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      <SEO 
        title="Explore Recipes" 
        description="Browse the global ReciBee repository. Find, fork, and star the best recipes from around the world."
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b border-carbon-gray-80 gap-4">
        <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar -mb-[1px]">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "pb-4 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === 'all' ? "text-white" : "text-carbon-gray-30 hover:text-white"
            )}
          >
            All Recipes
            {activeTab === 'all' && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-carbon-blue-60" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={cn(
              "pb-4 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === 'mine' ? "text-white" : "text-carbon-gray-30 hover:text-white"
            )}
          >
            My Recipes
            {activeTab === 'mine' && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-carbon-blue-60" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={cn(
              "pb-4 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === 'favorites' ? "text-white" : "text-carbon-gray-30 hover:text-white"
            )}
          >
            Starred
            {activeTab === 'favorites' && (
              <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-carbon-blue-60" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs md:text-sm text-carbon-gray-30 pb-4">
          <div className="flex items-center gap-1">
            <GitBranch size={14} />
            <span>{recipes.length} recipes</span>
          </div>
          <div className="h-4 w-[1px] bg-carbon-gray-80" />
          <div className="flex items-center gap-1">
            <Filter size={14} />
            <span>All branches</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-carbon-blue-60 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-carbon-gray-30">Loading repository...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="border border-dashed border-carbon-gray-80 rounded-lg p-12 text-center space-y-4">
          <div className="flex justify-center">
            <Database size={48} className="text-carbon-gray-80" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">Repository is empty</h3>
            <p className="text-carbon-gray-30 max-w-sm mx-auto">
              Start by creating a new recipe, importing from a URL, or seed the database with a starter recipe.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-6 py-2 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              New Recipe
            </button>
            <button
              onClick={handleSeed}
              className="flex items-center gap-2 border border-carbon-gray-80 hover:bg-carbon-gray-80 text-white px-6 py-2 text-sm font-medium transition-colors"
            >
              <Database size={16} />
              Seed Starter
            </button>
          </div>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="space-y-8">
          <div className="grid gap-4">
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
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-8 border-t border-carbon-gray-80">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-carbon-gray-30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-1 mx-4">
                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={cn(
                      "min-w-[36px] h-9 flex items-center justify-center text-sm font-medium transition-all rounded-md",
                      page === currentPage 
                        ? "bg-carbon-blue-60 text-white shadow-lg shadow-carbon-blue-60/20" 
                        : page === '...' 
                          ? "text-carbon-gray-30 cursor-default" 
                          : "text-carbon-gray-30 hover:text-white hover:bg-carbon-gray-80"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-carbon-blue-60 hover:text-carbon-blue-70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-carbon-gray-80 rounded-lg p-12 text-center">
          {searchQuery ? (
            <>
              <p className="text-carbon-gray-30">No recipes found matching "{searchQuery}".</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-carbon-blue-60 hover:underline text-sm mt-2"
              >
                Clear search
              </button>
            </>
          ) : activeTab === 'mine' ? (
            <div className="space-y-4">
              <p className="text-carbon-gray-30">You haven't created or forked any recipes yet.</p>
              <button
                onClick={handleCreate}
                className="text-carbon-blue-60 hover:underline text-sm"
              >
                Create your first recipe
              </button>
            </div>
          ) : activeTab === 'favorites' ? (
            <p className="text-carbon-gray-30">You haven't starred any recipes yet.</p>
          ) : (
            <p className="text-carbon-gray-30">No recipes found.</p>
          )}
        </div>
      )}
    </div>
  );
}
