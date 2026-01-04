import React, { useState } from 'react';
import { FoodItem, Recipe } from '../types';
import { generateSmartRecipes } from '../services/geminiService';
import { Sparkles, ChefHat, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

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
    <div className="pb-24">
      <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
            <ChefHat size={200} />
        </div>
        
        <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
            <ChefHat className="fill-white/20" /> Smart Kitchen
            </h2>
            <p className="opacity-90 mb-6 text-orange-50 max-w-sm text-lg leading-relaxed">
            Turn your leftover ingredients into a masterpiece. AI powered waste reduction.
            </p>
            <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-900/20 hover:shadow-orange-900/30 hover:bg-orange-50 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-90 disabled:cursor-not-allowed"
            >
            {loading ? (
                <>Thinking <Sparkles size={18} className="animate-spin" /></>
            ) : (
                <>Generate Magic Recipes <Sparkles size={18} /></>
            )}
            </button>
        </div>
      </div>

      <div className="space-y-5">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
            <div 
              className="p-5 cursor-pointer flex justify-between items-start"
              onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
            >
              <div className="flex-1 pr-4">
                <h3 className="font-bold text-slate-800 text-xl mb-2 group-hover:text-orange-600 transition-colors">{recipe.title}</h3>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><Clock size={16} /> {recipe.cookingTime} min</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    recipe.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-100' :
                    recipe.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                    'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
              <div className={`p-2 rounded-full bg-slate-50 transition-transform duration-300 ${expandedId === recipe.id ? 'rotate-180' : ''}`}>
                 <ChevronDown className="text-slate-400" />
              </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedId === recipe.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-5 pt-0">
                <div className="h-px w-full bg-slate-100 mb-4"></div>
                <p className="text-slate-600 mb-5 italic bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">"{recipe.description}"</p>
                
                <div className="mb-6">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Ingredients
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 before:content-['•'] before:text-slate-300 before:mr-1">
                        {ing}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg inline-flex items-center gap-2 border border-emerald-100">
                    <Sparkles size={12} />
                    Uses from pantry: {recipe.savedItems.join(", ")}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Instructions
                  </h4>
                  <ol className="space-y-3 text-sm text-slate-600">
                    {recipe.instructions.map((inst, i) => (
                      <li key={i} className="flex gap-3">
                         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                         <span className="pt-0.5">{inst}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); onCookRecipe(recipe); }}
                  className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ChefHat size={20} /> I Cooked This! (Complete)
                </button>
              </div>
            </div>
          </div>
        ))}

        {recipes.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <ChefHat size={32} className="text-orange-400" />
            </div>
            <p className="font-medium text-lg text-slate-600">Ready to cook?</p>
            <p className="text-sm opacity-70">Tap "Generate Magic Recipes" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;