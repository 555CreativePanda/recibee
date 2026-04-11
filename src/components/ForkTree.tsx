import React from 'react';
import { Recipe } from '../types';
import { GitFork, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface ForkTreeProps {
  currentRecipeId: string;
  allRecipes: Recipe[];
}

interface TreeNodeProps {
  recipe: Recipe;
  allRecipes: Recipe[];
  level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ recipe, allRecipes, level }) => {
  const children = allRecipes
    .filter(r => r.parent_id === recipe.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const userHandle = recipe.user_id ? recipe.user_id.slice(0, 8) : 'unknown';

  return (
    <div className="relative">
      {/* Vertical Connector Line */}
      {level > 0 && (
        <div className="absolute -left-[21px] top-0 bottom-0 w-px bg-carbon-gray-80" />
      )}
      
      <div className="flex items-start gap-3 py-2 relative">
        {/* Horizontal Branch Connector */}
        {level > 0 && (
          <div className="absolute -left-[21px] top-6 w-5 h-px bg-carbon-gray-80" />
        )}

        <div className="flex-1 bg-carbon-gray-100/30 border border-carbon-gray-80 p-3 hover:border-carbon-blue-60 transition-all hover:bg-carbon-gray-100/50 group rounded-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-carbon-gray-80 p-1.5 rounded-sm">
                <GitFork size={14} className="text-carbon-blue-60" />
              </div>
              <div className="flex flex-col min-w-0">
                <Link 
                  to={`/recipe/${recipe.id}`}
                  className="text-sm font-bold text-white hover:underline truncate"
                >
                  {recipe.title}
                </Link>
                <div className="flex items-center gap-2 text-[10px] text-carbon-gray-30 font-mono">
                  <User size={10} />
                  <span>{userHandle}</span>
                  <span>•</span>
                  <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <Link 
              to={`/recipe/${recipe.id}`}
              className="text-carbon-gray-30 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div className="ml-4 md:ml-8 space-y-1">
          {children.map(child => (
            <TreeNode 
              key={child.id} 
              recipe={child} 
              allRecipes={allRecipes} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ForkTree: React.FC<ForkTreeProps> = ({ currentRecipeId, allRecipes }) => {
  const children = allRecipes
    .filter(r => r.parent_id === currentRecipeId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (children.length === 0) {
    return (
      <div className="border border-dashed border-carbon-gray-80 rounded-lg p-12 text-center">
        <p className="text-carbon-gray-30">No forks yet. Be the first to fork this recipe!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {children.map(child => (
        <TreeNode 
          key={child.id} 
          recipe={child} 
          allRecipes={allRecipes} 
          level={0} 
        />
      ))}
    </div>
  );
};
