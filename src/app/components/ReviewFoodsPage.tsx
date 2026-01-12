import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Plus, SlidersHorizontal, HelpCircle, Check } from 'lucide-react';
import { getSession } from '../../lib/firebase';
import { CORE_CATEGORIES, categorizeFood } from '../../utils/foodCategorization';
import { useAuth } from '../../lib/useAuth';
import { saveCurrentInventory, createInventoryFromScan } from '../../lib/inventory';

type FoodItem = {
  id: string;
  name: string;
  category: string;
  needsConfirmation?: boolean;
  source?: 'keyword' | 'ai' | 'user';
  confidence?: 'high' | 'medium' | 'low';
};

type DietGoal = 'maintain' | 'bulk' | 'cut';
type DietaryFilter = 'highProtein' | 'vegetarian' | 'glutenFree';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

const normalizeCategory = (raw: string): string => {
  const value = (raw || '').trim().toLowerCase();
  if (!value) return 'Other';

  if (value.startsWith('protein')) return 'Proteins';
  if (value.startsWith('meat') || value.startsWith('fish') || value.startsWith('seafood')) return 'Proteins';
  if (value.startsWith('veg')) return 'Vegetables';
  if (value.startsWith('dair')) return 'Dairy';
  if (value.startsWith('pantry') || value.startsWith('grain') || value.startsWith('pasta') || value.startsWith('spice')) return 'Pantry';
  if (['proteins', 'vegetables', 'dairy', 'pantry', 'other'].includes(value)) return value[0].toUpperCase() + value.slice(1);
  return 'Other';
};

const MIN_INGREDIENTS_REQUIRED = 3;

export function ReviewFoodsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const imageUrlsFromState = (location.state as any)?.imageUrls as string[] | undefined;

  const queryParams = new URLSearchParams(location.search);
  const fridgeSessionIdFromQuery = queryParams.get('fridgeSessionId') || undefined;
  const pantrySessionIdFromQuery = queryParams.get('pantrySessionId') || undefined;
  const fridgeSessionIdFromState = (location.state as any)?.fridgeSessionId as string | null | undefined;
  const pantrySessionIdFromState = (location.state as any)?.pantrySessionId as string | null | undefined;
  const fridgeSessionId = fridgeSessionIdFromQuery ?? (fridgeSessionIdFromState || undefined);
  const pantrySessionId = pantrySessionIdFromQuery ?? (pantrySessionIdFromState || undefined);
  const imageUrlsFromStorage = (() => {
    try {
      const raw = sessionStorage.getItem('plately:lastImageUrls');
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? (parsed as string[]) : undefined;
    } catch {
      return undefined;
    }
  })();
  const imageUrls = imageUrlsFromState ?? imageUrlsFromStorage;

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [newFood, setNewFood] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [goal, setGoal] = useState<DietGoal>('maintain');
  const [filters, setFilters] = useState<Set<DietaryFilter>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [categorizingFoods, setCategorizingFoods] = useState<Set<string>>(new Set());
  const [showCategoryPicker, setShowCategoryPicker] = useState<string | null>(null);
  const [inventorySaved, setInventorySaved] = useState(false);

  const categories = [...CORE_CATEGORIES];

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        setScanProgress(10);

        // 1) Prefer explicit imageUrls (passed from Upload)
        // 2) Otherwise, try recovering image URLs from Firestore session IDs
        let urlsToScan: string[] | undefined = imageUrls;

        if ((!urlsToScan || urlsToScan.length === 0) && (fridgeSessionId || pantrySessionId)) {
          setScanProgress(20);

          const recovered: string[] = [];
          const sessionIds = [fridgeSessionId, pantrySessionId].filter(Boolean) as string[];

          for (const sid of sessionIds) {
            const session = (await getSession(sid)) as any;
            const imgs = Array.isArray(session?.images) ? session.images : [];
            for (const img of imgs) {
              const url = typeof img?.url === 'string' ? img.url : null;
              if (url) recovered.push(url);
            }
          }

          urlsToScan = recovered;

          try {
            sessionStorage.setItem('plately:lastImageUrls', JSON.stringify(recovered));
          } catch {
            // ignore
          }
        }

        if (!urlsToScan || urlsToScan.length === 0) {
          setFoods([]);
          setLoading(false);
          setScanProgress(0);
          return;
        }

        setScanProgress(40);

        const resp = await fetch(`${backendUrl}/api/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrls: urlsToScan }),
        });

        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data?.error || 'Scan failed');
        }

        setScanProgress(50);

        const scannedFoods = (data?.foods || []).filter((f: any) => f && f.name);
        
        setScanProgress(60);
        
        // Categorize each food using our 3-layer system
        const categorizedFoods: FoodItem[] = [];
        const totalFoods = scannedFoods.length;
        
        for (let i = 0; i < scannedFoods.length; i++) {
          const food = scannedFoods[i];
          const foodName = String(food.name).trim();
          const result = await categorizeFood(foodName, backendUrl);
          
          categorizedFoods.push({
            id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            name: foodName,
            category: result.category,
            needsConfirmation: result.category === 'Other',
            source: result.source,
            confidence: result.confidence,
          });
          
          // Gradually increase progress from 60% to 95% as we categorize
          const progress = 60 + Math.floor((i + 1) / totalFoods * 35);
          setScanProgress(progress);
        }

        if (!cancelled) {
          setScanProgress(100);
          setFoods(categorizedFoods);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Scan failed');
          setFoods([]);
          setLoading(false);
          setScanProgress(0);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [imageUrls]);

  const removeFood = (id: string) => {
    setFoods(foods.filter((food) => food.id !== id));
  };

  const addFood = async () => {
    if (newFood.trim()) {
      const foodName = newFood.trim();
      const tempId = Date.now().toString();
      
      // Add food with temporary "categorizing" state
      setCategorizingFoods((prev) => new Set(prev).add(tempId));
      
      const newItem: FoodItem = {
        id: tempId,
        name: foodName,
        category: '...',
        needsConfirmation: false,
      };
      setFoods([...foods, newItem]);
      setNewFood('');
      
      // Categorize in background
      const result = await categorizeFood(foodName, backendUrl);
      
      setFoods((prevFoods) =>
        prevFoods.map((f) =>
          f.id === tempId
            ? {
                ...f,
                category: result.category,
                needsConfirmation: result.category === 'Other',
                source: result.source,
                confidence: result.confidence,
              }
            : f
        )
      );
      
      setCategorizingFoods((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const toggleFilter = (filter: DietaryFilter) => {
    const newFilters = new Set(filters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setFilters(newFilters);
  };

  const updateFoodCategory = (foodId: string, newCategory: string) => {
    setFoods((prevFoods) =>
      prevFoods.map((f) =>
        f.id === foodId
          ? {
              ...f,
              category: newCategory,
              needsConfirmation: false,
              source: 'user',
              confidence: 'high',
            }
          : f
      )
    );
    setShowCategoryPicker(null);
  };

  const handleGenerate = async () => {
    try {
      const ingredientNames = foods.map((f) => f.name).filter(Boolean);
      sessionStorage.setItem('plately:lastIngredients', JSON.stringify(ingredientNames));

      // TODO: Save to inventory if user is authenticated
      // This will store the current ingredient list so they don't need to rescan
      if (user) {
        try {
          // Get the first uploaded image URL to store as "last scan" photo
          const firstImageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined;
          
          // Convert current foods to inventory format
          const inventory = createInventoryFromScan(foods, firstImageUrl);
          
          // Save to Firestore
          await saveCurrentInventory(user.uid, inventory);
          setInventorySaved(true);
          console.log('✅ Inventory saved successfully');
        } catch (error) {
          console.error('❌ Failed to save inventory (non-blocking):', error);
          // Don't block meal generation if inventory save fails
        }
      }
    } catch {
      // ignore
    }

    navigate('/loading', {
      state: {
        ingredients: foods.map((f) => f.name).filter(Boolean),
        goal,
        filters: Array.from(filters),
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAF7] py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#2ECC71] text-white flex items-center justify-center" style={{ fontWeight: 600 }}>
                ✓
              </div>
              <span className="text-[#2ECC71] hidden sm:inline" style={{ fontWeight: 600 }}>
                Upload
              </span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-[#2ECC71]"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#2ECC71] text-white flex items-center justify-center" style={{ fontWeight: 600 }}>
                2
              </div>
              <span className="text-[#2ECC71] hidden sm:inline" style={{ fontWeight: 600 }}>
                Review Foods
              </span>
            </div>
            <div className="w-8 md:w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center" style={{ fontWeight: 600 }}>
                3
              </div>
              <span className="text-gray-600 hidden sm:inline" style={{ fontWeight: 500 }}>
                Generate Meals
              </span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl mb-3" style={{ fontWeight: 700, color: '#2C2C2C' }}>
            We found these foods
          </h2>
          <p className="text-gray-600">
            {loading ? 'Scanning your photos…' : 'Not perfect? Add anything we missed below.'}
          </p>
          {loadError && (
            <p className="text-sm text-red-600 mt-2">
              Scan error: {loadError}
            </p>
          )}
          {!loading && !loadError && (!imageUrls || imageUrls.length === 0) && (
            <p className="text-sm text-gray-500 mt-2">
              No uploaded images were found to scan. Go back and upload via the QR flow (so we have image URLs).
            </p>
          )}
        </div>

        {/* Food Categories */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg mb-8">
          {categories.map((category) => {
            const categoryFoods = foods.filter((food) => food.category === category);
            if (categoryFoods.length === 0) return null;

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-lg mb-3" style={{ fontWeight: 700, color: '#2ECC71' }}>
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categoryFoods.map((food) => (
                    <div key={food.id} className="relative">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-[#F9FAF7] border rounded-full transition-colors group ${
                          food.needsConfirmation
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-gray-200 hover:border-[#2ECC71]'
                        }`}
                      >
                        <span className="text-[#2C2C2C]" style={{ fontWeight: 500 }}>
                          {food.name}
                        </span>
                        
                        {categorizingFoods.has(food.id) && (
                          <span className="text-xs text-gray-400">...</span>
                        )}
                        
                        {food.needsConfirmation && !categorizingFoods.has(food.id) && (
                          <button
                            onClick={() => setShowCategoryPicker(food.id)}
                            className="text-yellow-600 hover:text-yellow-700"
                            title="Confirm category"
                          >
                            <HelpCircle size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => removeFood(food.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {/* Category Picker Dropdown */}
                      {showCategoryPicker === food.id && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-10 min-w-[200px]">
                          <p className="text-xs text-gray-500 mb-2 px-2">Select category:</p>
                          <div className="space-y-1">
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                onClick={() => updateFoodCategory(food.id, cat)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Food Input */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg mb-8">
          <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: '#2C2C2C' }}>
            Add missing items
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFood}
              onChange={(e) => setNewFood(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFood()}
              placeholder="Type an ingredient..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
            />
            <button
              onClick={addFood}
              disabled={!newFood.trim()}
              className="px-6 py-3 bg-[#2ECC71] text-white rounded-xl hover:bg-[#1E8449] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Goals and Dietary Filters */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg mb-8">
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
                    onClick={() => setGoal(g)}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/upload"
            className="px-8 py-3 text-[#2C2C2C] hover:text-[#2ECC71] transition-colors"
            style={{ fontWeight: 500 }}
          >
            Back to Upload
          </Link>
          <button
            onClick={handleGenerate}
            disabled={foods.length < MIN_INGREDIENTS_REQUIRED}
            className={`px-8 py-4 rounded-xl transition-all shadow-lg ${
              foods.length < MIN_INGREDIENTS_REQUIRED
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#2ECC71] text-white hover:bg-[#1E8449] hover:shadow-xl'
            }`}
            style={{ fontWeight: 700, fontSize: '1.125rem' }}
          >
            Generate 5 Meals
          </button>
        </div>

        {/* Info */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-500">
            We detected {foods.length} items. The more ingredients you have, the more meal options we can create!
          </p>
          {inventorySaved && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">Saved to Inventory</span>
            </div>
          )}
          {foods.length < MIN_INGREDIENTS_REQUIRED && (
            <p className="text-sm text-red-600 font-semibold">
              Please add at least {MIN_INGREDIENTS_REQUIRED} ingredients to generate meals.
            </p>
          )}
        </div>
      </div>

      {/* Loading Overlay with Progress Bar */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-[#2ECC71]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#2ECC71] rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">
                Scanning Your Photos
              </h3>
              <p className="text-gray-600 mb-6">
                AI is detecting ingredients from your images...
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#2ECC71] to-[#1E8449] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{scanProgress}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
