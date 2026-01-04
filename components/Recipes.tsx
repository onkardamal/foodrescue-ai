import React, { useState } from 'react';
import { FoodItem, Recipe } from '../types';
import { generateSmartRecipes } from '../services/geminiService';
import { Sparkles, ChefHat, Clock, ChevronDown, ChevronUp, AlertCircle, ArrowRight } from 'lucide-react';

interface RecipesProps {
  inventory: FoodItem[];
  onCookRecipe: (recipe: Recipe) => void;
}

const Recipes: React.FC<RecipesProps> = ({ inventory, onCookRecipe }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const activeItems = inventory.filter(i => i.status === 'active');
      const generated = await generateSmartRecipes(activeItems);
      setRecipes(generated);
    } catch (e) {
      alert("Oops! AI couldn't think of recipes right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 md:pb-0 px-4 pt-4 animate-in fade-in duration-500">
       <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-[28px] md:text-[36px] font-[700] text-[#212121] dark:text-white leading-[36px]">Smart Recipes</h2>
                <p className="text-[14px] font-[400] text-[#757575] dark:text-slate-400 mt-1">Cook with what you have.</p>
            </div>
            <div className="w-[40px] h-[40px] bg-[#1CAE9E]/10 rounded-full flex items-center justify-center text-[#1CAE9E]">
                <ChefHat size={20} />
            </div>
       </div>

      <div className="bg-[#212121] dark:bg-slate-900 rounded-[20px] p-6 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
             Generate New Ideas
            </h2>
            <p className="opacity-70 mb-6 text-sm leading-relaxed max-w-[240px]">
             AI analyzes your inventory to suggest recipes that reduce waste.
            </p>
            <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#1CAE9E] text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
            {loading ? (
                <>Thinking <Sparkles size={18} className="animate-spin" /></>
            ) : (
                <>Create Recipes <Sparkles size={18} /></>
            )}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white dark:bg-slate-800 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden border border-slate-50 dark:border-slate-700 h-fit">
            <div 
              className="p-4 cursor-pointer flex justify-between items-start"
              onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
            >
              <div className="flex-1 pr-4">
                <h3 className="font-bold text-[#212121] dark:text-white text-lg mb-2">{recipe.title}</h3>
                <div className="flex gap-3 text-sm text-[#757575] dark:text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={14} /> {recipe.cookingTime}m</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                    recipe.difficulty === 'Easy' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' :
                    recipe.difficulty === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30' :
                    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
              <div className={`p-2 rounded-full bg-[#F5F5F5] dark:bg-slate-700 transition-transform duration-300 ${expandedId === recipe.id ? 'rotate-180' : ''}`}>
                 <ChevronDown size={16} className="text-[#757575] dark:text-slate-400" />
              </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedId === recipe.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-5 pt-0">
                <div className="h-px w-full bg-[#F5F5F5] dark:bg-slate-700 mb-4"></div>
                <p className="text-[#757575] dark:text-slate-400 mb-5 italic text-sm">"{recipe.description}"</p>
                
                <div className="mb-6">
                  <h4 className="font-bold text-[#212121] dark:text-white mb-3 text-sm uppercase tracking-wider">Ingredients</h4>
                  <ul className="grid grid-cols-1 gap-2 text-sm text-[#555] dark:text-slate-300">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1CAE9E] mt-1.5 shrink-0"></span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-xs font-medium text-[#1CAE9E] bg-[#1CAE9E]/10 dark:bg-[#1CAE9E]/20 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                    <Sparkles size={12} />
                    Using: {recipe.savedItems.join(", ")}
                  </div>
                </div>

                <div className="mb-6">
                   <h4 className="font-bold text-[#212121] dark:text-white mb-3 text-sm uppercase tracking-wider">Instructions</h4>
                  <ol className="space-y-4 text-sm text-[#555] dark:text-slate-300">
                    {recipe.instructions.map((inst, i) => (
                      <li key={i} className="flex gap-3">
                         <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F5F5F5] dark:bg-slate-700 text-[#757575] dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-[#EEE] dark:border-slate-600">{i + 1}</span>
                         <span className="pt-0.5 leading-relaxed">{inst}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); onCookRecipe(recipe); }}
                  className="w-full bg-[#212121] dark:bg-slate-900 text-white py-3.5 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-black/10"
                >
                  <ChefHat size={18} /> Mark as Cooked
                </button>
              </div>
            </div>
          </div>
        ))}

        {recipes.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-[#757575] dark:text-slate-400 bg-white dark:bg-slate-800 rounded-[16px] border border-dashed border-[#E0E0E0] dark:border-slate-700">
            <div className="bg-[#F5F5F5] dark:bg-slate-700 p-3 rounded-full mb-3">
                <ChefHat size={24} className="text-[#BDBDBD] dark:text-slate-500" />
            </div>
            <p className="font-medium text-sm">No recipes generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;