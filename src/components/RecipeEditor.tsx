import { useState, useRef, useEffect } from 'react';
import { Recipe, Ingredient, Step } from '../types';
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
  const [isPublic, setIsPublic] = useState(recipe.is_public ?? true);
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
  
  const [steps, setSteps] = useState<{ id: string, text: string, isSubheading: boolean }[]>(
    recipe.steps.map(step => {
      const isObj = step !== null && typeof step === 'object';
      const textValue = isObj ? (step as Step).text : (step as string || '');
      const isSub = isObj ? !!(step as Step).isSubheading : String(textValue).startsWith('[SECTION]:');
      return {
        id: Math.random().toString(36).slice(2, 11),
        text: isSub && !isObj ? String(textValue).replace('[SECTION]:', '').trim() : (textValue as string || ''),
        isSubheading: isSub
      };
    })
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
      text: '',
      isSubheading: false
    }]);
    setFocusRequest({ type: 'step', index: newIndex });
  };

  const updateStep = (index: number, value: string | boolean, field: 'text' | 'isSubheading' = 'text') => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value } as any;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const isTitleEmpty = (title || '').trim() === '';
    
    const emptyIngredients = ingredients
      .map((ing, idx) => (ing.item || '').trim() === '' ? idx : -1)
      .filter(idx => idx !== -1);
    
    const emptySteps = steps
      .map((step, idx) => (step.text || '').trim() === '' ? idx : -1)
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
      is_public: true, // Force all recipes to be public
      ingredients: ingredients.map(({ id, ...ing }) => ing), // Strip temp IDs before saving
      steps: steps.map(({ id, ...s }) => s)
    });
  };

  const getIngredientDiff = (ing: Ingredient, idx: number) => {
    const baseIngredients = recipe.original_ingredients || [];
    if (baseIngredients.length === 0) return null;

    const originalIng = baseIngredients[idx];
    if (!originalIng) return { type: 'new' };
    
    const changes: string[] = [];
    if ((originalIng.item || '').trim().toLowerCase() !== (ing.item || '').trim().toLowerCase()) changes.push('item');
    if ((originalIng.amount || '').trim() !== (ing.amount || '').trim()) changes.push('amount');
    if ((originalIng.unit || '').trim() !== (ing.unit || '').trim()) changes.push('unit');
    
    if (changes.length > 0) return { type: 'changed', original: originalIng, fields: changes };
    return null;
  };

  const getStepDiff = (stepText: string, idx: number) => {
    const baseSteps = recipe.original_steps || [];
    if (baseSteps.length === 0) return null;

    const originalStep = baseSteps[idx];
    if (originalStep === undefined) return { type: 'new' };
    const originalText = (originalStep !== null && typeof originalStep === 'object') ? (originalStep as Step).text : (originalStep as string || '');
    if ((originalText || '').trim() !== (stepText || '').trim()) return { type: 'changed', original: originalText };
    return null;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-kitchen-border p-10 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-kitchen-border pb-8 gap-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-kitchen-text">{isFork ? 'TWEAK' : isNew ? 'New Recipe' : 'Edit Recipe'}</h2>
          {recipe.original_ingredients && (
            <p className="text-[10px] text-kitchen-muted font-bold mt-2 uppercase tracking-widest">
              Tracking changes from original import
            </p>
          )}
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-kitchen-border hover:bg-stone-50 px-8 py-4 text-sm font-bold text-kitchen-muted transition-all rounded-2xl uppercase tracking-widest active:scale-95"
          >
            <X size={20} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-kitchen-primary hover:bg-orange-700 text-white px-10 py-4 text-sm font-bold transition-all rounded-2xl shadow-lg shadow-orange-100 uppercase tracking-widest active:scale-95"
          >
            <Save size={20} />
            Save
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <label className="block text-xs uppercase tracking-widest text-kitchen-muted font-bold">Recipe Title</label>
          {isFork && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-kitchen-primary bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              <div className="w-1.5 h-1.5 bg-kitchen-primary rounded-full" />
              <span>Tweaked</span>
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
          placeholder="e.g. Grandma's Spicy Pasta"
          className={cn(
            "w-full bg-stone-50 border p-5 text-kitchen-text rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all text-2xl font-serif font-bold",
            errors.title ? "border-red-500 ring-1 ring-red-500" : "border-kitchen-border"
          )}
        />
        {errors.title && (
          <p className="text-xs text-red-500 font-bold uppercase tracking-widest px-2">Title cannot be empty</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Prep Time</label>
          <input
            type="text"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="e.g. 15 mins"
            className="w-full bg-stone-50 border border-kitchen-border p-4 text-sm text-kitchen-text font-medium rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Cook Time</label>
          <input
            type="text"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="e.g. 45 mins"
            className="w-full bg-stone-50 border border-kitchen-border p-4 text-sm text-kitchen-text font-medium rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Servings</label>
          <input
            type="text"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="e.g. 4 people"
            className="w-full bg-stone-50 border border-kitchen-border p-4 text-sm text-kitchen-text font-medium rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Cuisine</label>
          <input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="e.g. Italian"
            className="w-full bg-stone-50 border border-kitchen-border p-4 text-sm text-kitchen-text font-medium rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Course</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. Main Dish"
            className="w-full bg-stone-50 border border-kitchen-border p-4 text-sm text-kitchen-text font-medium rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Public Visibility</label>
          <button
            disabled
            className={cn(
              "w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all text-sm font-bold uppercase tracking-widest",
              "bg-stone-50 border-kitchen-border text-stone-400 cursor-not-allowed"
            )}
          >
            <span>Public (Required)</span>
            <div className={cn(
              "w-10 h-5 rounded-full relative transition-all bg-green-200"
            )}>
              <div className={cn(
                "w-3 h-3 bg-white rounded-full absolute top-1 transition-all right-1"
              )} />
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Kitchen Tools</label>
          <div className="flex gap-3">
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
              placeholder="Add tool..."
              className="flex-1 bg-stone-50 border border-kitchen-border p-4 text-sm text-kitchen-text font-medium rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all"
            />
            <button
              onClick={() => {
                if (newEquipment.trim()) {
                  setEquipment([...equipment, newEquipment.trim()]);
                  setNewEquipment('');
                }
              }}
              className="bg-stone-100 hover:bg-stone-200 p-4 text-kitchen-text transition-all rounded-2xl active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {equipment.map((item, i) => (
              <span key={i} className="flex items-center gap-3 bg-stone-100 text-kitchen-text text-[11px] font-bold px-4 py-2 rounded-xl border border-kitchen-border uppercase tracking-widest">
                {item}
                <button onClick={() => setEquipment(equipment.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Tags</label>
          <div className="flex gap-3">
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
              placeholder="Add tag..."
              className="flex-1 bg-stone-50 border border-kitchen-border p-4 text-sm text-kitchen-text font-medium rounded-2xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all"
            />
            <button
              onClick={() => {
                if (newKeyword.trim()) {
                  setKeywords([...keywords, newKeyword.trim()]);
                  setNewKeyword('');
                }
              }}
              className="bg-stone-100 hover:bg-stone-200 p-4 text-kitchen-text transition-all rounded-2xl active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {keywords.map((tag, i) => (
              <span key={i} className="flex items-center gap-3 bg-orange-50 text-kitchen-primary text-[11px] font-bold px-4 py-2 rounded-xl border border-orange-100 uppercase tracking-widest">
                #{tag}
                <button onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-[10px] uppercase tracking-widest text-kitchen-muted font-bold">Chef's Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any extra tips or notes here..."
          className="w-full bg-stone-50 border border-kitchen-border p-6 text-sm text-kitchen-text rounded-3xl focus:border-kitchen-primary focus:ring-1 focus:ring-kitchen-primary outline-none transition-all min-h-[160px] italic font-medium leading-relaxed"
        />
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-kitchen-border pb-6">
          <div className="flex items-center gap-6">
            <label className="block text-xs uppercase tracking-widest text-kitchen-muted font-bold">Ingredients</label>
            {recipe.original_ingredients && (
              <div className="flex gap-6 text-[10px] uppercase font-bold tracking-widest hidden sm:flex">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span className="text-green-600">New</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-kitchen-primary rounded-full" />
                  <span className="text-kitchen-primary">Modified</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={addIngredient}
            className="bg-orange-50 hover:bg-orange-100 text-kitchen-primary flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all uppercase tracking-widest active:scale-95"
          >
            <Plus size={20} />
            Add Ingredient
          </button>
        </div>
        
        <div className="space-y-6">
          {ingredients.map((ing, idx) => {
            const diff = getIngredientDiff(ing, idx);
            const isNew = diff?.type === 'new';
            const isChanged = diff?.type === 'changed';

            return (
              <div key={ing.id} className={cn(
                "flex flex-wrap md:flex-nowrap gap-4 p-6 md:p-4 transition-all items-center relative border rounded-3xl group",
                isNew && "bg-green-50/50 border-green-200",
                isChanged && "bg-orange-50/50 border-orange-200",
                ing.isHeader && "bg-stone-50 border-kitchen-border",
                !isNew && !isChanged && !ing.isHeader && "bg-white border-kitchen-border hover:border-kitchen-primary hover:shadow-md"
              )}>
                <button
                  onClick={() => updateIngredient(idx, 'isHeader', !ing.isHeader)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center text-[10px] font-bold border transition-all rounded-xl shrink-0",
                    ing.isHeader 
                      ? "bg-kitchen-primary border-kitchen-primary text-white shadow-md" 
                      : "bg-white border-kitchen-border text-kitchen-muted hover:border-kitchen-primary hover:text-kitchen-primary"
                  )}
                  title="Toggle as Section Header"
                >
                  H
                </button>
                <div className="flex-1 min-w-[200px] flex flex-col">
                  {isChanged && diff.fields?.includes('item') && (
                    <span className="text-[10px] text-kitchen-muted line-through decoration-kitchen-primary/50 px-1 font-bold uppercase tracking-widest">
                      {diff.original?.item}
                    </span>
                  )}
                  <input
                    ref={el => { ingredientRefs.current[idx] = el; }}
                    placeholder={ing.isHeader ? "Section Header (e.g. For Garnish)" : "Ingredient Item"}
                    value={ing.item}
                    onChange={(e) => {
                      updateIngredient(idx, 'item', e.target.value);
                      if (errors.ingredients.includes(idx)) {
                        setErrors(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i !== idx) }));
                      }
                    }}
                    className={cn(
                      "w-full bg-transparent border-b p-2 text-sm outline-none transition-all",
                      errors.ingredients.includes(idx) ? "border-red-500" : "border-stone-200 focus:border-kitchen-primary",
                      isNew && !errors.ingredients.includes(idx) && "text-green-700 font-bold",
                      isChanged && diff.fields?.includes('item') && "text-kitchen-primary font-bold",
                      ing.isHeader && "font-serif font-bold text-kitchen-text text-lg"
                    )}
                  />
                </div>
                {!ing.isHeader && (
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex flex-col flex-1 md:w-32">
                      {isChanged && diff.fields?.includes('amount') && (
                        <span className="text-[10px] text-kitchen-muted line-through decoration-kitchen-primary/50 px-1 font-bold uppercase tracking-widest">
                          {diff.original?.amount}
                        </span>
                      )}
                      <input
                        placeholder="Amount"
                        value={ing.amount}
                        onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                        className={cn(
                          "w-full bg-transparent border-b border-stone-200 p-2 text-sm outline-none focus:border-kitchen-primary transition-all font-medium",
                          isChanged && diff.fields?.includes('amount') && "text-kitchen-primary font-bold"
                        )}
                      />
                    </div>
                    <div className="flex flex-col flex-1 md:w-32">
                      {isChanged && diff.fields?.includes('unit') && (
                        <span className="text-[10px] text-kitchen-muted line-through decoration-kitchen-primary/50 px-1 font-bold uppercase tracking-widest">
                          {diff.original?.unit}
                        </span>
                      )}
                      <input
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                        className={cn(
                          "w-full bg-transparent border-b border-stone-200 p-2 text-sm outline-none focus:border-kitchen-primary transition-all font-medium",
                          isChanged && diff.fields?.includes('unit') && "text-kitchen-primary font-bold"
                        )}
                      />
                    </div>
                  </div>
                )}
                {errors.ingredients.includes(idx) && (
                  <p className="absolute -bottom-6 left-16 text-[10px] text-red-500 font-bold uppercase tracking-widest z-10">Item cannot be empty</p>
                )}
                <button
                  onClick={() => removeIngredient(idx)}
                  className="p-3 text-stone-300 hover:text-red-500 transition-all ml-auto active:scale-90"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-kitchen-border pb-6">
          <label className="block text-xs uppercase tracking-widest text-kitchen-muted font-bold">Preparation Steps</label>
          <button
            onClick={addStep}
            className="bg-orange-50 hover:bg-orange-100 text-kitchen-primary flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all uppercase tracking-widest active:scale-95"
          >
            <Plus size={20} />
            Add Step
          </button>
        </div>
        
        <div className="space-y-10">
          {steps.map((step, idx) => {
            const isSection = step.isSubheading;
            const diff = getStepDiff(step.text, idx);
            const isNew = diff?.type === 'new';
            const isChanged = diff?.type === 'changed';

            return (
              <div key={step.id} className={cn(
                "flex gap-6 items-start p-8 -mx-4 rounded-3xl transition-all border",
                isNew && "bg-green-50/50 border-green-200 border-l-8 border-l-green-500",
                isChanged && "bg-orange-50/50 border-orange-200 border-l-8 border-l-kitchen-primary",
                !isNew && !isChanged && "bg-white border-kitchen-border hover:border-kitchen-primary hover:shadow-md"
              )}>
                {!isSection && (
                  <span className={cn(
                    "mt-2 font-serif text-3xl font-bold shrink-0 leading-none",
                    isNew ? "text-green-600" : isChanged ? "text-kitchen-primary" : "text-stone-200"
                  )}>
                    {idx + 1}.
                  </span>
                )}
                <div className="flex-1 space-y-4">
                  {isChanged && (
                    <p className="text-[11px] text-kitchen-muted line-through decoration-kitchen-primary/50 italic px-1 font-bold uppercase tracking-widest">
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
                    placeholder={isSection ? "Section Header (e.g. For the Sauce)" : "Describe this cooking step..."}
                    className={cn(
                      "w-full bg-transparent border-b p-2 text-sm outline-none transition-all min-h-[100px] leading-relaxed font-medium",
                      errors.steps.includes(idx) ? "border-red-500" : "border-stone-200 focus:border-kitchen-primary",
                      isSection && "font-serif font-bold text-kitchen-text text-xl min-h-[50px]",
                      isNew && !errors.steps.includes(idx) && "text-green-700 font-bold",
                      isChanged && !errors.steps.includes(idx) && "text-kitchen-text font-bold"
                    )}
                  />
                  {errors.steps.includes(idx) && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Step cannot be empty</p>
                  )}
                  <button
                    onClick={() => updateStep(idx, !isSection, 'isSubheading')}
                    className="text-[10px] uppercase tracking-[0.2em] font-bold text-kitchen-muted hover:text-kitchen-primary transition-all bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100"
                  >
                    {isSection ? 'Convert to Step' : 'Convert to Section Header'}
                  </button>
                </div>
                <button
                  onClick={() => removeStep(idx)}
                  className="p-3 text-stone-300 hover:text-red-500 transition-all active:scale-90"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
