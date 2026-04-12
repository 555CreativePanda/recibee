import { useState, useRef, useEffect } from 'react';
import { Recipe, Ingredient } from '../types';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface RecipeEditorProps {
  recipe: Recipe;
  onSave: (updatedRecipe: Recipe) => void;
  onCancel: () => void;
}

export function RecipeEditor({ recipe, onSave, onCancel }: RecipeEditorProps) {
  const [title, setTitle] = useState(recipe.title || '');
  const [prepTime, setPrepTime] = useState(recipe.prep_time || '');
  const [cookTime, setCookTime] = useState(recipe.cook_time || '');
  const [servings, setServings] = useState(recipe.servings || '');
  const [cuisine, setCuisine] = useState(recipe.cuisine || '');
  const [course, setCourse] = useState(recipe.course || '');
  const [notes, setNotes] = useState(recipe.notes || '');
  const [keywords, setKeywords] = useState<string[]>(recipe.keywords || []);
  const [equipment, setEquipment] = useState<string[]>(recipe.equipment || []);
  const [newKeyword, setNewKeyword] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  
  // Use stable IDs for ingredients and steps to prevent duplicate key errors in the editor
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe.ingredients.map(ing => ({
      ...ing,
      item: ing.item || '',
      amount: ing.amount || '',
      unit: ing.unit || '',
      id: Math.random().toString(36).slice(2, 11)
    }))
  );
  
  const [steps, setSteps] = useState<{ id: string, text: string }[]>(
    recipe.steps.map(step => ({
      id: Math.random().toString(36).slice(2, 11),
      text: step || ''
    }))
  );
  const [errors, setErrors] = useState<{ title: boolean, ingredients: number[], steps: number[] }>({ 
    title: false, 
    ingredients: [], 
    steps: [] 
  });
  
  const isNew = recipe.id.startsWith('temp-');
  const isFork = !!recipe.parent_id;
  const [focusRequest, setFocusRequest] = useState<{ type: 'ingredient' | 'step', index: number } | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const ingredientRefs = useRef<(HTMLInputElement | null)[]>([]);
  const stepRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    console.log(`RecipeEditor mounted for: ${recipe.title}`, {
      hasOriginalIngredients: !!recipe.original_ingredients,
      originalIngredientsCount: recipe.original_ingredients?.length,
      hasOriginalSteps: !!recipe.original_steps,
      originalStepsCount: recipe.original_steps?.length,
      isNew,
      isFork
    });

    // Focus title on mount for new recipes
    if (isNew && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isNew, isFork, recipe.title, recipe.original_ingredients, recipe.original_steps]);

  useEffect(() => {
    if (focusRequest) {
      if (focusRequest.type === 'ingredient') {
        const el = ingredientRefs.current[focusRequest.index];
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (focusRequest.type === 'step') {
        const el = stepRefs.current[focusRequest.index];
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      setFocusRequest(null);
    }
  }, [focusRequest]);

  const addIngredient = () => {
    const newIndex = ingredients.length;
    setIngredients([...ingredients, { 
      id: Math.random().toString(36).slice(2, 11),
      item: '', 
      amount: '', 
      unit: '' 
    }]);
    setFocusRequest({ type: 'ingredient', index: newIndex });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | boolean) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value } as Ingredient;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addStep = () => {
    const newIndex = steps.length;
    setSteps([...steps, { 
      id: Math.random().toString(36).slice(2, 11),
      text: '' 
    }]);
    setFocusRequest({ type: 'step', index: newIndex });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], text: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const isTitleEmpty = title.trim() === '';
    
    const emptyIngredients = ingredients
      .map((ing, idx) => ing.item.trim() === '' ? idx : -1)
      .filter(idx => idx !== -1);
    
    const emptySteps = steps
      .map((step, idx) => step.text.trim() === '' ? idx : -1)
      .filter(idx => idx !== -1);

    if (isTitleEmpty || emptyIngredients.length > 0 || emptySteps.length > 0) {
      setErrors({ 
        title: isTitleEmpty, 
        ingredients: emptyIngredients, 
        steps: emptySteps 
      });

      // Focus the first error
      if (isTitleEmpty) {
        titleRef.current?.focus();
      } else if (emptyIngredients.length > 0) {
        ingredientRefs.current[emptyIngredients[0]]?.focus();
      } else if (emptySteps.length > 0) {
        stepRefs.current[emptySteps[0]]?.focus();
      }
      return;
    }

    onSave({
      ...recipe,
      title,
      prep_time: prepTime,
      cook_time: cookTime,
      servings,
      cuisine,
      course,
      keywords,
      equipment,
      notes,
      ingredients: ingredients.map(({ id, ...ing }) => ing), // Strip temp IDs before saving
      steps: steps.map(s => s.text)
    });
  };

  const getIngredientDiff = (ing: Ingredient, idx: number) => {
    const baseIngredients = recipe.original_ingredients || [];
    if (baseIngredients.length === 0) return null;

    const originalIng = baseIngredients[idx];
    if (!originalIng) return { type: 'new' };
    
    const changes: string[] = [];
    if (originalIng.item.trim().toLowerCase() !== ing.item.trim().toLowerCase()) changes.push('item');
    if (originalIng.amount.trim() !== ing.amount.trim()) changes.push('amount');
    if (originalIng.unit.trim() !== ing.unit.trim()) changes.push('unit');
    
    if (changes.length > 0) return { type: 'changed', original: originalIng, fields: changes };
    return null;
  };

  const getStepDiff = (stepText: string, idx: number) => {
    const baseSteps = recipe.original_steps || [];
    if (baseSteps.length === 0) return null;

    const originalStep = baseSteps[idx];
    if (originalStep === undefined) return { type: 'new' };
    if (originalStep.trim() !== stepText.trim()) return { type: 'changed', original: originalStep };
    return null;
  };

  return (
    <div className="bg-carbon-gray-90 border border-carbon-gray-80 p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-carbon-gray-80 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-medium">{isFork ? 'Forked Recipe' : isNew ? 'New Recipe' : 'Edit Recipe'}</h2>
          {recipe.original_ingredients && (
            <p className="text-[10px] text-carbon-gray-30 font-mono mt-1 uppercase tracking-widest">
              Tracking changes from original import
            </p>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-carbon-gray-80 hover:bg-carbon-gray-80 px-4 py-2 text-sm font-medium transition-colors"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-carbon-blue-60 hover:bg-carbon-blue-70 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="block text-xs uppercase tracking-wider text-carbon-gray-30 font-semibold">Title</label>
          {isFork && (
            <div className="flex items-center gap-1 text-[9px] uppercase font-mono text-yellow-500">
              <div className="w-1.5 h-1.5 bg-yellow-500" />
              <span>Forked</span>
            </div>
          )}
        </div>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors(prev => ({ ...prev, title: false }));
          }}
          placeholder="Recipe Title (e.g. Grandma's Spicy Pasta)"
          className={cn(
            "w-full bg-carbon-gray-100 border p-3 text-white focus:border-carbon-blue-60 outline-none transition-colors",
            errors.title ? "border-red-500 ring-1 ring-red-500" : "border-carbon-gray-80"
          )}
        />
        {errors.title && (
          <p className="text-xs text-red-500 font-medium">Title cannot be empty</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Prep Time</label>
          <input
            type="text"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="e.g. 15 mins"
            className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Cook Time</label>
          <input
            type="text"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="e.g. 45 mins"
            className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Servings</label>
          <input
            type="text"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="e.g. 4 people"
            className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Cuisine</label>
          <input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="e.g. Italian"
            className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Course</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. Main Dish"
            className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Equipment</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newEquipment.trim()) {
                    setEquipment([...equipment, newEquipment.trim()]);
                    setNewEquipment('');
                  }
                }
              }}
              placeholder="Add equipment..."
              className="flex-1 bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
            />
            <button
              onClick={() => {
                if (newEquipment.trim()) {
                  setEquipment([...equipment, newEquipment.trim()]);
                  setNewEquipment('');
                }
              }}
              className="bg-carbon-gray-80 hover:bg-carbon-gray-70 p-2 text-white transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipment.map((item, i) => (
              <span key={i} className="flex items-center gap-1 bg-carbon-gray-80 text-[10px] font-mono px-2 py-1 rounded-sm">
                {item}
                <button onClick={() => setEquipment(equipment.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Keywords</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newKeyword.trim()) {
                    setKeywords([...keywords, newKeyword.trim()]);
                    setNewKeyword('');
                  }
                }
              }}
              placeholder="Add keyword..."
              className="flex-1 bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors"
            />
            <button
              onClick={() => {
                if (newKeyword.trim()) {
                  setKeywords([...keywords, newKeyword.trim()]);
                  setNewKeyword('');
                }
              }}
              className="bg-carbon-gray-80 hover:bg-carbon-gray-70 p-2 text-white transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((tag, i) => (
              <span key={i} className="flex items-center gap-1 bg-carbon-blue-60/20 text-carbon-blue-60 text-[10px] font-mono px-2 py-1 rounded-sm border border-carbon-blue-60/30">
                #{tag}
                <button onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-wider text-carbon-gray-30 font-semibold">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any extra tips or notes here..."
          className="w-full bg-carbon-gray-100 border border-carbon-gray-80 p-3 text-sm text-white focus:border-carbon-blue-60 outline-none transition-colors min-h-[100px]"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="block text-xs uppercase tracking-wider text-carbon-gray-30 font-semibold">Ingredients</label>
            {recipe.original_ingredients && (
              <div className="flex gap-3 text-[9px] uppercase font-mono hidden sm:flex">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#24A148]" />
                  <span>New</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#8A3FFC]" />
                  <span>Modified</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={addIngredient}
            className="text-carbon-blue-60 hover:text-carbon-blue-70 flex items-center gap-1 text-sm font-medium"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        
        <div className="space-y-4 md:space-y-2">
          {ingredients.map((ing, idx) => {
            const diff = getIngredientDiff(ing, idx);
            const isNew = diff?.type === 'new';
            const isChanged = diff?.type === 'changed';

            return (
              <div key={ing.id} className={cn(
                "flex flex-wrap md:flex-nowrap gap-2 p-2 md:p-1 transition-colors items-center relative border md:border-none border-carbon-gray-80",
                isNew && "bg-[#24A148]/5 border-[#24A148]/20",
                isChanged && "bg-[#8A3FFC]/5 border-[#8A3FFC]/20",
                ing.isHeader && "bg-carbon-blue-60/5 border-carbon-blue-60/20"
              )}>
                <button
                  onClick={() => updateIngredient(idx, 'isHeader', !ing.isHeader)}
                  className={cn(
                    "px-2 py-1 text-[10px] uppercase font-bold tracking-widest border transition-colors",
                    ing.isHeader 
                      ? "bg-carbon-blue-60 border-carbon-blue-60 text-white" 
                      : "border-carbon-gray-80 text-carbon-gray-30 hover:border-carbon-blue-60"
                  )}
                  title="Toggle as Section Header"
                >
                  H
                </button>
                <div className="flex-1 min-w-[150px] flex flex-col">
                  {isChanged && diff.fields?.includes('item') && (
                    <span className="text-[9px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50 px-1">
                      {diff.original?.item}
                    </span>
                  )}
                  <input
                    ref={el => { ingredientRefs.current[idx] = el; }}
                    placeholder={ing.isHeader ? "Section Header (e.g. For Garnish)" : "Item"}
                    value={ing.item}
                    onChange={(e) => {
                      updateIngredient(idx, 'item', e.target.value);
                      if (errors.ingredients.includes(idx)) {
                        setErrors(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i !== idx) }));
                      }
                    }}
                    className={cn(
                      "w-full bg-carbon-gray-100 border p-2 text-sm outline-none focus:border-carbon-blue-60 transition-colors",
                      errors.ingredients.includes(idx) ? "border-red-500 ring-1 ring-red-500" : "border-carbon-gray-80",
                      isNew && !errors.ingredients.includes(idx) && "border-[#24A148]/50 text-[#24A148]",
                      isChanged && diff.fields?.includes('item') && "border-[#8A3FFC]/50 text-[#8A3FFC]",
                      ing.isHeader && "font-bold text-carbon-blue-60"
                    )}
                  />
                </div>
                {!ing.isHeader && (
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex flex-col flex-1 md:w-24">
                      {isChanged && diff.fields?.includes('amount') && (
                        <span className="text-[9px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50 px-1">
                          {diff.original?.amount}
                        </span>
                      )}
                      <input
                        placeholder="Amount"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                        className={cn(
                          "w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm outline-none focus:border-carbon-blue-60",
                          isChanged && diff.fields?.includes('amount') && "border-[#8A3FFC]/50 text-[#8A3FFC]"
                        )}
                      />
                    </div>
                    <div className="flex flex-col flex-1 md:w-24">
                      {isChanged && diff.fields?.includes('unit') && (
                        <span className="text-[9px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50 px-1">
                          {diff.original?.unit}
                        </span>
                      )}
                      <input
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        className={cn(
                          "w-full bg-carbon-gray-100 border border-carbon-gray-80 p-2 text-sm outline-none focus:border-carbon-blue-60",
                          isChanged && diff.fields?.includes('unit') && "border-[#8A3FFC]/50 text-[#8A3FFC]"
                        )}
                      />
                    </div>
                  </div>
                )}
                {errors.ingredients.includes(idx) && (
                  <p className="absolute -bottom-4 left-12 text-[10px] text-red-500 font-medium z-10">Item cannot be empty</p>
                )}
                <button
                  onClick={() => removeIngredient(idx)}
                  className="p-2 text-carbon-gray-30 hover:text-red-500 transition-colors ml-auto"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs uppercase tracking-wider text-carbon-gray-30 font-semibold">Steps</label>
          <button
            onClick={addStep}
            className="text-carbon-blue-60 hover:text-carbon-blue-70 flex items-center gap-1 text-sm font-medium"
          >
            <Plus size={16} />
            Add Step
          </button>
        </div>
        
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isSection = step.text.startsWith('[SECTION]:');
            const diff = getStepDiff(step.text, idx);
            const isNew = diff?.type === 'new';
            const isChanged = diff?.type === 'changed';

            return (
              <div key={step.id} className={cn(
                "flex gap-2 items-start p-2 -mx-2 transition-colors",
                isNew && "bg-[#24A148]/5 border-l-2 border-[#24A148]",
                isChanged && "bg-[#8A3FFC]/5 border-l-2 border-[#8A3FFC]"
              )}>
                {!isSection && (
                  <span className={cn(
                    "mt-2 font-mono text-sm font-bold shrink-0",
                    isNew ? "text-[#24A148]" : isChanged ? "text-[#8A3FFC]" : "text-carbon-blue-60"
                  )}>
                    {idx + 1}.
                  </span>
                )}
                <div className="flex-1 space-y-1">
                  {isChanged && (
                    <p className="text-[10px] text-carbon-gray-40 line-through decoration-[#8A3FFC]/50 italic px-1">
                      {diff.original}
                    </p>
                  )}
                  <textarea
                    ref={el => { stepRefs.current[idx] = el; }}
                    value={step.text}
                    onChange={(e) => {
                      updateStep(idx, e.target.value);
                      if (errors.steps.includes(idx)) {
                        setErrors(prev => ({ ...prev, steps: prev.steps.filter(i => i !== idx) }));
                      }
                    }}
                    placeholder={isSection ? "Section Header" : "Step description"}
                    className={cn(
                      "w-full bg-carbon-gray-100 border p-2 text-sm outline-none focus:border-carbon-blue-60 min-h-[60px] transition-colors",
                      errors.steps.includes(idx) ? "border-red-500 ring-1 ring-red-500" : "border-carbon-gray-80",
                      isSection && "font-bold text-carbon-blue-60 min-h-[40px]",
                      isNew && !errors.steps.includes(idx) && "border-[#24A148]/50 text-[#24A148]",
                      isChanged && !errors.steps.includes(idx) && "border-[#8A3FFC]/50"
                    )}
                  />
                  {errors.steps.includes(idx) && (
                    <p className="text-[10px] text-red-500 font-medium">Step cannot be empty</p>
                  )}
                  <button
                    onClick={() => updateStep(idx, isSection ? step.text.replace('[SECTION]:', '').trim() : `[SECTION]: ${step.text}`)}
                    className="text-[10px] uppercase tracking-widest font-bold text-carbon-gray-30 hover:text-carbon-blue-60 transition-colors"
                  >
                    {isSection ? 'Convert to Step' : 'Convert to Section Header'}
                  </button>
                </div>
                <button
                  onClick={() => removeStep(idx)}
                  className="p-2 text-carbon-gray-30 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
