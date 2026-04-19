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
        <div className="absolute -left-[21px] top-0 bottom-0 w-px bg-stone-200" />
      )}
      
      <div className="flex items-start gap-3 py-2 relative">
        {/* Horizontal Branch Connector */}
        {level > 0 && (
          <div className="absolute -left-[21px] top-6 w-5 h-px bg-stone-200" />
        )}

        <div className="flex-1 bg-white border border-kitchen-border p-4 hover:border-kitchen-primary transition-all hover:shadow-md group rounded-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="bg-stone-50 p-2 rounded-xl group-hover:bg-orange-50 transition-colors">
                <GitFork size={16} className="text-kitchen-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <Link 
                  to={`/recipe/${recipe.id}`}
                  className="text-base font-serif font-bold text-kitchen-text hover:text-kitchen-primary transition-colors truncate"
                >
                  {recipe.title}
                </Link>
                <div className="flex items-center gap-2 text-[10px] text-kitchen-muted font-bold uppercase tracking-widest">
                  <User size={12} />
                  <span>{userHandle}</span>
                  <span>•</span>
                  <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <Link 
              to={`/recipe/${recipe.id}`}
              className="text-stone-300 hover:text-kitchen-primary transition-colors p-1"
            >
              <ChevronRight size={20} />
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
      <div className="border-2 border-dashed border-stone-200 rounded-3xl p-16 text-center bg-stone-50/30">
        <GitFork size={40} className="mx-auto text-stone-200 mb-4" />
        <p className="text-kitchen-muted font-medium">No tweaks yet. Be the first to tweak this recipe!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
