import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, ChefHat, TrendingUp, Flame, RefreshCw, ExternalLink, SlidersHorizontal, ChevronDown, Lock, ChevronUp, Plus, X, Loader2, Info } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import { getOrCreateUserEntitlements } from '../../lib/firestoreUsers';
import { canSeeImages, canSeeFullMacros, canSeeRecipeLinks } from '../../lib/entitlements';
import type { UserEntitlements } from '../../lib/entitlements';
import { LockedFeature } from './LockedFeature';
import { UpgradeModal } from './UpgradeModal';

type Meal = {
  id: string;
  name: string;
  description: string;
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  healthScore?: number;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  ingredients: string[];
  recipeUrl?: string;
};

const getMealTitle = (meal: any): string => {
  if (typeof meal?.title === 'string' && meal.title.trim()) return meal.title;
  if (typeof meal?.name === 'string' && meal.name.trim()) return meal.name;
  return 'Meal';
};

const getMealKeyIngredients = (meal: any): string[] => {
  if (Array.isArray(meal?.keyIngredients)) return meal.keyIngredients;
  if (Array.isArray(meal?.ingredients)) return meal.ingredients;
  return [];
};

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

type DietGoal = 'maintain' | 'bulk' | 'cut';
type DietaryFilter = 'highProtein' | 'vegetarian' | 'glutenFree';

// Nutrition Dropdown Component
function NutritionDropdown({ meal }: { meal: Meal }) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate macro scores and comparisons
  const calculateMacroData = () => {
    const protein = meal.protein || 0;
    const carbs = meal.carbs || 0;
    const fat = meal.fat || 0;
    const totalCal = meal.calories || 0;

    // Calculate macro calories
    const proteinCal = protein * 4;
    const carbCal = carbs * 4;
    const fatCal = fat * 9;

    // Calculate percentages of total calories
    const proteinPct = totalCal > 0 ? proteinCal / totalCal : 0;
    const carbPct = totalCal > 0 ? carbCal / totalCal : 0;
    const fatPct = totalCal > 0 ? fatCal / totalCal : 0;

    // Calculate scores (0-100) by normalizing against upper bounds
    const proteinScore = Math.min(Math.max(Math.round((proteinPct / 0.4) * 100), 0), 100);
    const carbScore = Math.min(Math.max(Math.round((carbPct / 0.6) * 100), 0), 100);
    const fatScore = Math.min(Math.max(Math.round((fatPct / 0.4) * 100), 0), 100);

    // Comparison baseline
    const avgCalories = 600;
    const avgProtein = 20;
    const avgFat = 25;

    // Calculate comparisons
    const proteinMultiplier = protein / avgProtein;
    const fatMultiplier = fat / avgFat;
    const calMultiplier = totalCal / avgCalories;
    const fatDiff = ((avgFat - fat) / avgFat) * 100;
    const calDiff = ((avgCalories - totalCal) / avgCalories) * 100;

    return {
      proteinScore,
      carbScore,
      fatScore,
      proteinMultiplier,
      fatMultiplier,
      calMultiplier,
      fatDiff,
      calDiff,
      hasData: carbs > 0 && fat > 0
    };
  };

  const macroData = calculateMacroData();

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-[#F9FAF7] rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Flame size={16} className="text-[#2ECC71]" />
            <span className="text-sm" style={{ fontWeight: 600, color: '#2C2C2C' }}>
              {meal.calories} cal
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp size={16} className="text-[#2ECC71]" />
            <span className="text-sm" style={{ fontWeight: 600, color: '#2C2C2C' }}>
              {meal.protein}g protein
            </span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-xl space-y-4">
          {/* Macronutrients */}
          <div>
            <div className="text-xs text-gray-500 mb-3" style={{ fontWeight: 600 }}>
              MACRONUTRIENTS
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Protein</div>
                <div className="text-lg" style={{ fontWeight: 700, color: '#3498DB' }}>
                  {meal.protein}g
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Carbs</div>
                <div className="text-lg" style={{ fontWeight: 700, color: '#9B59B6' }}>
                  {meal.carbs || '—'}
                  {meal.carbs ? 'g' : ''}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Fat</div>
                <div className="text-lg" style={{ fontWeight: 700, color: '#F59E0B' }}>
                  {meal.fat || '—'}
                  {meal.fat ? 'g' : ''}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total Calories</span>
                <span className="text-sm" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                  {meal.calories} cal
                </span>
              </div>
            </div>
          </div>

          {/* Macro Scores */}
          {macroData.hasData && (
            <>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-3" style={{ fontWeight: 600 }}>
                  MACRO SCORES (0–100)
                </div>
                <div className="space-y-3">
                  {/* Protein Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-base">💪</span>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-12">Protein</span>
                      <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#3498DB] transition-all duration-300"
                          style={{ width: `${macroData.proteinScore}%` }}
                        />
                      </div>
                      <span className="text-sm w-8 text-right" style={{ fontWeight: 600, color: '#3498DB' }}>
                        {macroData.proteinScore}
                      </span>
                    </div>
                  </div>
                  
                  {/* Carbs Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-base">🍞</span>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-12">Carbs</span>
                      <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#9B59B6] transition-all duration-300"
                          style={{ width: `${macroData.carbScore}%` }}
                        />
                      </div>
                      <span className="text-sm w-8 text-right" style={{ fontWeight: 600, color: '#9B59B6' }}>
                        {macroData.carbScore}
                      </span>
                    </div>
                  </div>
                  
                  {/* Fat Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-base">🧈</span>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-12">Fat</span>
                      <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#F59E0B] transition-all duration-300"
                          style={{ width: `${macroData.fatScore}%` }}
                        />
                      </div>
                      <span className="text-sm w-8 text-right" style={{ fontWeight: 600, color: '#F59E0B' }}>
                        {macroData.fatScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-3" style={{ fontWeight: 600 }}>
                  COMPARED TO A TYPICAL MEAL
                </div>
                <div className="space-y-4">
                  {/* Protein Scale */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">💪</span>
                      <span className="text-sm text-gray-700 w-16">Protein</span>
                      <span className="text-sm" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                        {macroData.proteinMultiplier.toFixed(1)}×
                      </span>
                    </div>
                    <div className="ml-8 relative h-6 flex items-center">
                      <div className="absolute w-full h-0.5 bg-gray-300"></div>
                      <div 
                        className="absolute w-0.5 h-4 bg-gray-500"
                        style={{ left: '50%', transform: 'translateX(-50%)' }}
                        title="Average"
                      ></div>
                      <div 
                        className="absolute w-3 h-3 rounded-full bg-[#3498DB] border-2 border-white shadow-md"
                        style={{ 
                          left: `${Math.min(Math.max((macroData.proteinMultiplier / 2) * 100, 5), 95)}%`,
                          transform: 'translateX(-50%)'
                        }}
                        title="This meal"
                      ></div>
                      <span className="absolute text-xs text-gray-500" style={{ left: '50%', transform: 'translateX(-50%)', top: '18px' }}>avg</span>
                    </div>
                  </div>

                  {/* Fat Scale */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🧈</span>
                      <span className="text-sm text-gray-700 w-16">Fat</span>
                      <span className="text-sm" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                        {macroData.fatMultiplier.toFixed(1)}×
                      </span>
                    </div>
                    <div className="ml-8 relative h-6 flex items-center">
                      <div className="absolute w-full h-0.5 bg-gray-300"></div>
                      <div 
                        className="absolute w-0.5 h-4 bg-gray-500"
                        style={{ left: '50%', transform: 'translateX(-50%)' }}
                        title="Average"
                      ></div>
                      <div 
                        className="absolute w-3 h-3 rounded-full bg-[#F59E0B] border-2 border-white shadow-md"
                        style={{ 
                          left: `${Math.min(Math.max((macroData.fatMultiplier / 2) * 100, 5), 95)}%`,
                          transform: 'translateX(-50%)'
                        }}
                        title="This meal"
                      ></div>
                      <span className="absolute text-xs text-gray-500" style={{ left: '50%', transform: 'translateX(-50%)', top: '18px' }}>avg</span>
                    </div>
                  </div>

                  {/* Calories Scale */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🔥</span>
                      <span className="text-sm text-gray-700 w-16">Calories</span>
                      <span className="text-sm" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                        {macroData.calMultiplier.toFixed(2)}×
                      </span>
                    </div>
                    <div className="ml-8 relative h-6 flex items-center">
                      <div className="absolute w-full h-0.5 bg-gray-300"></div>
                      <div 
                        className="absolute w-0.5 h-4 bg-gray-500"
                        style={{ left: '50%', transform: 'translateX(-50%)' }}
                        title="Average"
                      ></div>
                      <div 
                        className="absolute w-3 h-3 rounded-full bg-[#2C2C2C] border-2 border-white shadow-md"
                        style={{ 
                          left: `${Math.min(Math.max((macroData.calMultiplier / 2) * 100, 5), 95)}%`,
                          transform: 'translateX(-50%)'
                        }}
                        title="This meal"
                      ></div>
                      <span className="absolute text-xs text-gray-500" style={{ left: '50%', transform: 'translateX(-50%)', top: '18px' }}>avg</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400 italic">
                  Scores are relative estimates based on macro distribution and common meal averages.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ResultsPage() {
  const location = useLocation();
  const [goal, setGoal] = useState<DietGoal>('maintain');
  const [filters, setFilters] = useState<Set<DietaryFilter>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealImageUrls, setMealImageUrls] = useState<Record<string, string>>({});
  const [mealImageLoading, setMealImageLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null);
  const { user } = useAuth();

  const filtersArray = useMemo(() => Array.from(filters), [filters]);

  // Load entitlements
  useEffect(() => {
    if (!user) {
      setEntitlements(null);
      return;
    }
    
    getOrCreateUserEntitlements(user.uid).then(setEntitlements).catch(console.error);
  }, [user]);

  // Check if features are unlocked
  const imagesUnlocked = !entitlements || canSeeImages(entitlements);
  const macrosUnlocked = !entitlements || canSeeFullMacros(entitlements);
  const recipesUnlocked = !entitlements || canSeeRecipeLinks(entitlements);

  useEffect(() => {
    const mealsFromState = (location.state as any)?.meals as Meal[] | undefined;
    const goalFromState = (location.state as any)?.goal as DietGoal | undefined;
    const filtersFromState = (location.state as any)?.filters as string[] | undefined;
    
    // Load goal from state or sessionStorage
    if (goalFromState) {
      setGoal(goalFromState);
    } else {
      try {
        const savedGoal = sessionStorage.getItem('plately:lastGoal');
        if (savedGoal && ['maintain', 'bulk', 'cut'].includes(savedGoal)) {
          setGoal(savedGoal as DietGoal);
        }
      } catch {
        // ignore
      }
    }
    
    // Load filters from state or sessionStorage
    if (Array.isArray(filtersFromState)) {
      setFilters(new Set(filtersFromState as DietaryFilter[]));
    } else {
      try {
        const savedFilters = sessionStorage.getItem('plately:lastFilters');
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          if (Array.isArray(parsed)) {
            setFilters(new Set(parsed as DietaryFilter[]));
          }
        }
      } catch {
        // ignore
      }
    }
    
    // Load ingredients from sessionStorage (always, regardless of where meals come from)
    try {
      const ingredientsRaw = sessionStorage.getItem('plately:lastIngredients');
      const ingredientsParsed = ingredientsRaw ? JSON.parse(ingredientsRaw) : null;
      if (Array.isArray(ingredientsParsed) && ingredientsParsed.length > 0) {
        setIngredients(ingredientsParsed);
      }
    } catch {
      // ignore
    }
    
    if (Array.isArray(mealsFromState) && mealsFromState.length > 0) {
      setMeals(mealsFromState);
      setMealImageUrls({});
      setMealImageLoading({});
      return;
    }

    try {
      const raw = sessionStorage.getItem('plately:lastMeals');
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        setMeals(parsed as Meal[]);
        setMealImageUrls({});
        setMealImageLoading({});
      }
      
      // Fallback: Extract ingredients from meals if still none loaded
      if (ingredients.length === 0 && Array.isArray(parsed) && parsed.length > 0) {
        const allIngredients = new Set<string>();
        parsed.forEach((meal: any) => {
          if (Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach((ing: string) => allIngredients.add(ing));
          }
        });
        if (allIngredients.size > 0) {
          const ingredientList = Array.from(allIngredients).slice(0, 15); // Limit to 15 most common
          setIngredients(ingredientList);
          sessionStorage.setItem('plately:lastIngredients', JSON.stringify(ingredientList));
        }
      }
    } catch {
      // ignore
    }
  }, [location.state]);

  // Fetch meal images (cached per card index in local component state)
  useEffect(() => {
    // Don't fetch images if user doesn't have access
    if (!imagesUnlocked) {
      console.log('Image generation disabled - requires Premium tier');
      return;
    }
    
    if (!meals.length) return;

    let cancelled = false;

    const maxAttempts = 12;

    const requestMealImage = async (meal: any, mealKey: string, attempt: number) => {
      if (cancelled) return;

      try {
        const resp = await fetch(`${backendUrl}/api/meal-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: getMealTitle(meal),
            keyIngredients: getMealKeyIngredients(meal),
          }),
        });

        const data = await resp.json().catch(() => ({}));

        const shouldRetryStatus =
          resp.status === 202 ||
          resp.status === 429 ||
          resp.status === 502 ||
          resp.status === 503 ||
          resp.status === 504;

        if (shouldRetryStatus) {
          // Backend is generating the image or a transient upstream error occurred; retry with backoff.
          if (attempt < maxAttempts && !cancelled) {
            const delayMs = Math.min(8000, 750 * Math.pow(1.4, attempt));
            window.setTimeout(() => {
              requestMealImage(meal, mealKey, attempt + 1);
            }, delayMs);
            return;
          }
          return;
        }

        if (!resp.ok) {
          // Keep placeholder; don't spam UI, but log for debugging.
          // eslint-disable-next-line no-console
          console.warn('Meal image request failed', resp.status, data);
          return;
        }

        const imageUrl = (data as any)?.imageUrl;
        if (!cancelled && typeof imageUrl === 'string' && imageUrl) {
          setMealImageUrls((prev) => ({ ...prev, [mealKey]: imageUrl }));
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Meal image request error', e);
      } finally {
        if (!cancelled) {
          setMealImageLoading((prev) => ({ ...prev, [mealKey]: false }));
        }
      }
    };

    const fetchImages = async () => {
      const targets = meals.map((meal, index) => ({ meal, key: String(index) }));

      setMealImageLoading((prev) => {
        const next = { ...prev };
        for (const t of targets) next[t.key] = true;
        return next;
      });

      await Promise.all(targets.map((t) => requestMealImage(t.meal, t.key, 0)));
    };

    fetchImages();
    return () => {
      cancelled = true;
    };
  }, [meals, imagesUnlocked]);

  const toggleFilter = (filter: DietaryFilter) => {
    const newFilters = new Set(filters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setFilters(newFilters);
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem('plately:lastFilters', JSON.stringify(Array.from(newFilters)));
    } catch {
      // ignore
    }
  };
  
  const handleGoalChange = (newGoal: DietGoal) => {
    setGoal(newGoal);
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem('plately:lastGoal', newGoal);
    } catch {
      // ignore
    }
  };

  const generateMore = async () => {
    try {
      setGenerating(true);
      setError(null);

      const ingredients = (() => {
        try {
          const raw = sessionStorage.getItem('plately:lastIngredients');
          const parsed = raw ? JSON.parse(raw) : null;
          return Array.isArray(parsed) ? (parsed as string[]) : [];
        } catch {
          return [];
        }
      })();

      if (!ingredients.length) {
        throw new Error('No ingredients found. Go back and scan a photo first.');
      }

      const resp = await fetch(`${backendUrl}/api/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          goal,
          filters: filtersArray,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Meal generation failed');

      setMeals(data?.meals || []);
      setMealImageUrls({});
      setMealImageLoading({});
      try {
        sessionStorage.setItem('plately:lastMeals', JSON.stringify(data?.meals || []));
      } catch {
        // ignore
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Meal generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-[#2ECC71] bg-[#2ECC71] bg-opacity-10';
      case 'Medium':
        return 'text-[#F4D03F] bg-[#F4D03F] bg-opacity-20';
      case 'Hard':
        return 'text-[#e74c3c] bg-[#e74c3c] bg-opacity-10';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthScoreColor = (score: number | undefined) => {
    const validScore = typeof score === 'number' && !isNaN(score) ? score : 75;
    if (validScore >= 85) return 'text-[#2ECC71] !border-[#2ECC71]';
    if (validScore >= 70) return 'text-[#F4D03F] !border-[#F4D03F]';
    return 'text-gray-600 !border-gray-400';
  };

  const formatHealthScore = (score: number | undefined): string => {
    // Ensure score is valid and between 0-100
    const validScore = typeof score === 'number' && !isNaN(score) ? score : 75;
    const normalized = Math.max(0, Math.min(100, Math.round(validScore)));
    return normalized.toString();
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      const updated = [...ingredients, newIngredient.trim()];
      setIngredients(updated);
      sessionStorage.setItem('plately:lastIngredients', JSON.stringify(updated));
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    const updated = ingredients.filter(i => i !== ingredient);
    setIngredients(updated);
    sessionStorage.setItem('plately:lastIngredients', JSON.stringify(updated));
  };

  const handleRegenerateWithIngredients = async () => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }
    await generateMore();
  };

  const handleRegenerateMeal = async (mealIndex: number) => {
    const mealKey = String(mealIndex);
    setRegeneratingMeal(mealKey);
    setError(null);

    try {
      const ingredientsToUse = ingredients.length > 0 ? ingredients : (() => {
        try {
          const raw = sessionStorage.getItem('plately:lastIngredients');
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();

      if (ingredientsToUse.length === 0) {
        throw new Error('No ingredients available. Please add ingredients first.');
      }

      // Get auth token if user is logged in
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await fetch(`${backendUrl}/api/meals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ingredients: ingredientsToUse,
          goal,
          filters: filtersArray,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to regenerate meal');

      if (Array.isArray(data?.meals) && data.meals.length > 0) {
        // Replace the specific meal
        const newMeals = [...meals];
        newMeals[mealIndex] = data.meals[0];
        setMeals(newMeals);

        // Clear the image for this meal so it regenerates
        setMealImageUrls(prev => {
          const updated = { ...prev };
          delete updated[mealKey];
          return updated;
        });

        // Update sessionStorage
        sessionStorage.setItem('plately:lastMeals', JSON.stringify(newMeals));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to regenerate meal');
    } finally {
      setRegeneratingMeal(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAF7] py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl mb-3" style={{ fontWeight: 700, color: '#2C2C2C' }}>
            Here are 5 meals you can make
          </h1>
          <p className="text-gray-600 text-lg">
            All recipes use your available ingredients
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Goals */}
            <div className="flex-1 w-full md:w-auto">
              <label className="text-sm text-gray-600 mb-2 block" style={{ fontWeight: 600 }}>
                Goal:
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['maintain', 'bulk', 'cut'] as DietGoal[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGoalChange(g)}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      goal === g
                        ? 'bg-[#2ECC71] text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F9FAF7] text-[#2C2C2C] rounded-xl hover:bg-gray-100 transition-all"
              style={{ fontWeight: 500 }}
            >
              <SlidersHorizontal size={20} />
              Dietary Filters
              {filters.size > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#2ECC71] text-white text-xs flex items-center justify-center">
                  {filters.size}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex gap-2 flex-wrap">
                {(['highProtein', 'vegetarian', 'glutenFree'] as DietaryFilter[]).map((filter) => {
                  const labels = {
                    highProtein: 'High Protein',
                    vegetarian: 'Vegetarian',
                    glutenFree: 'Gluten-Free',
                  };
                  return (
                    <button
                      key={filter}
                      onClick={() => toggleFilter(filter)}
                      className={`px-4 py-2 rounded-xl transition-all ${
                        filters.has(filter)
                          ? 'bg-[#2ECC71] text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ingredients Editor Section */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md mb-8">
          <button
            onClick={() => setShowIngredients(!showIngredients)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <ChefHat className="text-[#2ECC71]" size={24} />
              <div>
                <h3 className="text-lg" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                  My Ingredients
                </h3>
                <p className="text-sm text-gray-500">
                  {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            {showIngredients ? (
              <ChevronUp className="text-gray-400" size={20} />
            ) : (
              <ChevronDown className="text-gray-400" size={20} />
            )}
          </button>

          {showIngredients && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              {/* Add New Ingredient */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                  placeholder="Add an ingredient..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                />
                <button
                  onClick={handleAddIngredient}
                  className="px-4 py-2 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>

              {/* Ingredients List */}
              {ingredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl group hover:bg-gray-200 transition-all"
                    >
                      <span className="text-sm">{ingredient}</span>
                      <button
                        onClick={() => handleRemoveIngredient(ingredient)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No ingredients added yet. Add some to generate meals!
                </p>
              )}

              {/* Regenerate Button */}
              {ingredients.length > 0 && (
                <button
                  onClick={handleRegenerateWithIngredients}
                  disabled={generating}
                  className="w-full px-6 py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
                  {generating ? 'Regenerating...' : 'Regenerate Meals with These Ingredients'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Image Loading Info Banner */}
        {imagesUnlocked && Object.values(mealImageLoading).some(loading => loading) && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Generating meal images...</span> AI image generation can take up to 30 seconds per image. Your meals are ready to view while images load!
              </p>
            </div>
          </div>
        )}

        {/* Meals Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {meals.map((meal, index) => {
            const mealKey = String(index);
            const imageUrl = mealImageUrls[mealKey];

            return (
              <div
                key={mealKey}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
              >
                {/* Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-[#2ECC71] to-[#1E8449] relative overflow-hidden">
                  {!imagesUnlocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-40">
                      <div className="text-center text-white">
                        <Lock size={48} className="mx-auto mb-2" />
                        <p className="text-sm font-semibold">Premium Feature</p>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="text-xs underline mt-1 hover:text-yellow-300"
                        >
                          Upgrade to see images
                        </button>
                      </div>
                    </div>
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={getMealTitle(meal)}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        // eslint-disable-next-line no-console
                        console.warn('Meal image failed to load', { mealKey, imageUrl });
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71] to-[#1E8449]" />
                      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(110deg,rgba(255,255,255,0.0),rgba(255,255,255,0.25),rgba(255,255,255,0.0))] animate-pulse" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <ChefHat className="text-white opacity-20" size={80} />
                        {mealImageLoading[mealKey] && (
                          <div className="flex flex-col items-center gap-2 text-white">
                            <div className="flex items-center gap-2">
                              <Loader2 className="animate-spin" size={20} />
                              <span className="text-sm font-semibold">Generating image...</span>
                            </div>
                            <span className="text-xs opacity-90">This can take up to 30 seconds</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Health Score Badge */}
                  <div className="absolute top-4 right-4">
                    <div
                      className={`w-14 h-14 rounded-full bg-white border-4 flex items-center justify-center ${getHealthScoreColor(meal.healthScore ?? 75)}`}
                    >
                      <div className="text-center">
                        <div className="text-lg leading-none" style={{ fontWeight: 700 }}>
                          {formatHealthScore(meal.healthScore ?? 75)}
                        </div>
                        <div className="text-[10px] leading-none mt-0.5">score</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl mb-2" style={{ fontWeight: 700, color: '#2C2C2C' }}>
                    {getMealTitle(meal)}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{meal.description}</p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Clock size={16} />
                      <span>{meal.prepTime}</span>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs ${getDifficultyColor(meal.difficulty)}`}
                      style={{ fontWeight: 600 }}
                    >
                      {meal.difficulty}
                    </div>
                  </div>

                  {/* Nutrition */}
                  {/* Nutrition Dropdown - Gated for full macros */}
                  {macrosUnlocked ? (
                    <NutritionDropdown meal={meal} />
                  ) : (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Flame size={16} className="text-[#F4D03F]" />
                          <span className="text-sm" style={{ fontWeight: 600, color: '#2C2C2C' }}>
                            {meal.calories} cal
                          </span>
                        </div>
                        <Lock size={14} className="text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-500">
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="text-[#2ECC71] hover:underline font-semibold"
                        >
                          Upgrade to Premium
                        </button>{' '}
                        to see full macro breakdown
                      </div>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>
                      KEY INGREDIENTS:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {meal.ingredients.slice(0, 3).map((ingredient, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {ingredient}
                        </span>
                      ))}
                      {meal.ingredients.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-500">+{meal.ingredients.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Actions - Recipe Link Gated */}
                  <div className="flex gap-2">
                    {recipesUnlocked ? (
                      <a
                        href={meal.recipeUrl || `https://www.google.com/search?q=${encodeURIComponent(meal.name + ' recipe')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-md flex items-center justify-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        <ExternalLink size={16} />
                        View Recipe
                      </a>
                    ) : (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="flex-1 px-4 py-2.5 bg-gray-300 text-gray-600 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed relative"
                        style={{ fontWeight: 600 }}
                      >
                        <Lock size={16} />
                        View Recipe (Premium)
                      </button>
                    )}
                    <button
                      onClick={() => handleRegenerateMeal(index)}
                      disabled={regeneratingMeal === mealKey}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Regenerate this meal"
                    >
                      <RefreshCw size={16} className={regeneratingMeal === mealKey ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={generateMore}
            disabled={generating}
            className="px-8 py-4 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            style={{ fontWeight: 700, fontSize: '1.125rem' }}
          >
            <RefreshCw size={20} />
            {generating ? 'Generating…' : 'Generate 5 More'}
          </button>
          <Link
            to="/"
            className="px-8 py-4 bg-white text-[#2C2C2C] border-2 border-gray-300 rounded-xl hover:border-[#2ECC71] transition-all flex items-center gap-2"
            style={{ fontWeight: 600 }}
          >
            Start Over
          </Link>
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-500 mt-8">
          All recipes are customized based on your available ingredients and selected preferences
        </p>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="premium_feature"
        />
      )}
    </div>
  );
}
