import React, { useState, useEffect } from 'react';
import { FoodItem, Recipe } from '../types';
import { generateSmartRecipes } from '../services/geminiService';
import { ChevronLeft, Search, Sparkles, X, Clock, ChefHat, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface RecipesProps {
  inventory: FoodItem[];
  recipes: Recipe[];
  onUpdateRecipes: (recipes: Recipe[]) => void;
  onCookRecipe: (recipe: Recipe) => void;
}

// --- Component: Ingredient Chip ---
const IngredientChip: React.FC<{ 
  label: string; 
  onPress: (label: string) => void;
}> = ({ label, onPress }) => (
  <button 
    onClick={() => onPress(label)}
    className="h-[32px] px-[12px] bg-white dark:bg-slate-800 rounded-[16px] flex items-center justify-center active:scale-95 transition-transform mr-[8px] shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
  >
    <span className="text-[14px] font-[500] text-[#212121] dark:text-slate-200 whitespace-nowrap">{label}</span>
  </button>
);

// --- Component: Recipe Card ---
const RecipeCard: React.FC<{
  recipe: Recipe;
  onView: () => void;
}> = ({ recipe, onView }) => {
  const matchCount = recipe.savedItems.length;
  const totalCount = recipe.ingredients.length;
  // Prevent division by zero
  const percentage = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : 0;

  return (
    <div 
      onClick={onView}
      className="group bg-white dark:bg-slate-800 rounded-[20px] p-[20px] mb-[16px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-700/50 cursor-pointer relative overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 dark:bg-orange-900/10 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-3">
        <h3 className="font-bold text-[20px] text-[#212121] dark:text-white leading-snug pr-4">{recipe.title}</h3>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
             recipe.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
             recipe.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
             'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
        }`}>
            {recipe.difficulty}
        </div>
      </div>
      
      {/* Meta Row */}
      <div className="relative z-10 flex items-center gap-4 mb-5 text-[#757575] dark:text-slate-400 text-sm">
        <div className="flex items-center gap-1.5">
          <Clock size={16} />
          <span>{recipe.cookingTime} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ChefHat size={16} />
          <span>{recipe.ingredients.length} ingredients</span>
        </div>
      </div>

      {/* Ingredient Match Progress */}
      <div className="relative z-10 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-600/50">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[#212121] dark:text-slate-200">
                Ingredients You Have
            </span>
            <span className="text-xs font-bold text-[#1CAE9E]">
                {matchCount} / {totalCount} ({percentage}%)
            </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-2">
            <div 
                className="h-full bg-[#1CAE9E] rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${percentage}%` }}
            />
        </div>
        
        {/* Matched items list (truncated) */}
        {recipe.savedItems.length > 0 && (
            <p className="text-xs text-[#757575] dark:text-slate-400 truncate">
                <span className="text-[#1CAE9E] font-bold">✓</span> {recipe.savedItems.join(', ')}
            </p>
        )}
      </div>

      {/* Action */}
      <div className="relative z-10 flex items-center justify-between mt-2">
          <span className="text-xs text-[#757575] dark:text-slate-500 font-medium">Tap to view details</span>
          <div className="w-8 h-8 rounded-full bg-[#1CAE9E] flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-110 transition-transform">
              <ArrowRight size={16} strokeWidth={3} />
          </div>
      </div>
    </div>
  );
};

const Recipes: React.FC<RecipesProps> = ({ inventory, recipes, onUpdateRecipes, onCookRecipe }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  // State lifted to App.tsx: const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Check for passed state from Inventory
  useEffect(() => {
    if (location.state && location.state.ingredients) {
        setInputText(location.state.ingredients);
        // Optional: Auto-generate if coming from select mode
        // handleGenerate(location.state.ingredients);
    }
  }, [location.state]);

  // Filter for suggestions (Expiring items)
  const suggestionItems = inventory
    .filter(i => i.status === 'active')
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 5);

  const handleChipPress = (label: string) => {
    setInputText(prev => prev ? `${prev}, ${label}` : label);
  };

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // In a real app, we would pass 'inputText' to the AI service to bias the generation.
      // For this demo, we're still passing the whole inventory but arguably the service 
      // should be updated to take constraints.
      // Here we simulate filtering locally or via the prompt structure in geminiService.
      const generated = await generateSmartRecipes(inventory); 
      onUpdateRecipes(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Detail View (Simple Modal for demo) ---
  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 p-[20px] animate-in slide-in-from-bottom-10">
        <button onClick={() => setSelectedRecipe(null)} className="mb-6 flex items-center gap-2 text-[#757575] dark:text-slate-400 font-medium hover:text-[#212121] dark:hover:text-white transition-colors">
          <ChevronLeft size={24} /> Back to Recipes
        </button>
        <h1 className="text-[28px] font-bold text-[#212121] dark:text-white mb-4 leading-tight">{selectedRecipe.title}</h1>
        
        <div className="flex gap-3 mb-8">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock size={16} /> {selectedRecipe.cookingTime} mins
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${
                selectedRecipe.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                selectedRecipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
                <ChefHat size={16} /> {selectedRecipe.difficulty}
            </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-[#212121] dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1CAE9E]"></span> Ingredients
            </h3>
            <ul className="space-y-3">
              {selectedRecipe.ingredients.map((ing, i) => {
                  const isSaved = selectedRecipe.savedItems.some(saved => ing.toLowerCase().includes(saved.toLowerCase()));
                  return (
                    <li key={i} className={`flex items-start gap-3 text-sm ${isSaved ? 'text-[#212121] dark:text-white font-medium' : 'text-[#757575] dark:text-slate-400'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isSaved ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                            {isSaved ? <span className="text-xs font-bold">✓</span> : <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
                        </div>
                        {ing}
                    </li>
                  );
              })}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-[#212121] dark:text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF9800]"></span> Instructions
            </h3>
             <ol className="space-y-6">
              {selectedRecipe.instructions.map((ins, i) => (
                  <li key={i} className="flex gap-4 text-[#757575] dark:text-slate-300 text-base leading-relaxed">
                      <span className="font-bold text-[#1CAE9E] shrink-0 text-lg bg-teal-50 dark:bg-teal-900/20 w-8 h-8 rounded-full flex items-center justify-center -mt-1">{i+1}</span>
                      {ins}
                  </li>
              ))}
            </ol>
          </div>

          <button 
            onClick={() => { onCookRecipe(selectedRecipe); setSelectedRecipe(null); }}
            className="w-full bg-[#1CAE9E] text-white h-[56px] rounded-[16px] font-bold text-lg mt-4 shadow-xl shadow-teal-500/20 active:scale-[0.98] transition-all hover:bg-[#179c8d]"
          >
            Mark as Cooked
          </button>
          <div className="h-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-[100px]">
      {/* A. Header */}
      <header className="pt-[12px] px-[16px] pb-[16px] flex flex-col gap-[4px]">
        <div className="flex items-center gap-[12px] h-[44px]">
          <button 
            onClick={() => navigate(-1)}
            className="w-[44px] h-[44px] flex items-center justify-center -ml-[12px] rounded-full active:bg-slate-100 dark:active:bg-slate-800"
            aria-label="Back"
          >
            <ChevronLeft size={24} className="text-[#212121] dark:text-white" />
          </button>
          <h1 className="text-[24px] font-[700] leading-[32px] text-[#212121] dark:text-white">AI Recipe Suggestions</h1>
        </div>
        <p className="text-[14px] leading-[20px] text-[#757575] dark:text-slate-400 pl-[4px]">
          Use your expiring food wisely
        </p>
      </header>

      {/* C. Featured Card */}
      <section className="mx-[16px] mt-[4px] rounded-[16px] p-[20px] shadow-lg shadow-orange-500/20 bg-gradient-to-br from-[#FF9800] to-[#F57C00]">
        <div className="flex items-center gap-2 mb-[12px] text-white/90">
             <Sparkles size={16} />
             <h2 className="text-[14px] font-bold uppercase tracking-wide">Use These Soon</h2>
        </div>
        <div className="flex overflow-x-auto pb-[4px] scrollbar-hide -mx-[4px] px-[4px]">
          {suggestionItems.map(item => (
            <IngredientChip 
              key={item.id} 
              label={item.name} 
              onPress={handleChipPress} 
            />
          ))}
        </div>
      </section>

      {/* D. Search/Input */}
      <div className="mx-[16px] mt-[24px] h-[52px] bg-[#F5F5F5] dark:bg-slate-900 rounded-[16px] flex items-center px-[16px] focus-within:ring-2 focus-within:ring-[#FF9800]/50 transition-shadow">
        <Search size={22} className="text-[#757575] dark:text-slate-500" />
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter ingredients (e.g., chicken, tomato...)"
          className="flex-1 bg-transparent border-none outline-none h-full px-[12px] text-[16px] text-[#212121] dark:text-white placeholder-[#BDBDBD] dark:placeholder-slate-500"
          aria-label="Search Ingredients"
        />
        {inputText && (
          <button onClick={() => setInputText('')} className="w-[44px] h-[44px] flex items-center justify-center -mr-[12px]">
            <X size={20} className="text-[#757575]" />
          </button>
        )}
      </div>

      {/* E. Primary Action */}
      <div className="px-[16px] mt-[16px]">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-[56px] bg-[#212121] dark:bg-white text-white dark:text-[#212121] rounded-[16px] flex items-center justify-center gap-[10px] active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-black/10 dark:shadow-white/5 hover:bg-black dark:hover:bg-slate-200"
          aria-label={loading ? "Generating recipes" : "Generate Recipes"}
        >
          {loading ? (
             <Sparkles size={20} className="animate-spin" />
          ) : (
            <>
              <Sparkles size={20} />
              <span className="text-[16px] font-bold">Generate Recipes</span>
            </>
          )}
        </button>
      </div>

      {/* F. Results Area */}
      <div className="px-[16px] mt-[24px] animate-in fade-in duration-300">
        {recipes.length > 0 ? (
          recipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onView={() => setSelectedRecipe(recipe)} 
            />
          ))
        ) : (
           // Empty State
           <div className="flex flex-col items-center justify-center py-[60px] opacity-60">
             <div className="w-[80px] h-[80px] bg-[#F5F5F5] dark:bg-slate-800 rounded-full flex items-center justify-center mb-[20px]">
               <ChefHat size={40} className="text-[#BDBDBD] dark:text-slate-600" />
             </div>
             <p className="text-[18px] font-bold text-[#212121] dark:text-slate-300">No recipes yet</p>
             <p className="text-[14px] text-[#757575] dark:text-slate-500 mt-[8px] max-w-[200px] text-center leading-relaxed">
                Add ingredients or tap Generate Recipes to start cooking!
             </p>
           </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;