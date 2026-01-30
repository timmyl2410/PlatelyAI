/**
 * resultsRanking.ts
 * Utilities for scoring, ranking, tagging, and filtering meals on the Results page
 * Handles missing data gracefully with safe fallbacks
 */

export type Meal = {
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

export type MealTag = 'Fastest' | 'High protein' | 'Lowest calories' | 'Best match';
export type VibeFilter = 'Quick' | 'High Protein' | 'Light' | 'Comfort';

/**
 * Parse prepTime string to minutes
 * Handles formats like "30 mins", "1 hour 15 mins", "1h 30m", etc.
 * Returns fallback value if parsing fails
 */
function parsePrepTime(prepTime: string): number {
  try {
    const lower = prepTime.toLowerCase();
    let minutes = 0;
    
    // Extract hours
    const hourMatch = lower.match(/(\d+)\s*(h|hour)/);
    if (hourMatch) {
      minutes += parseInt(hourMatch[1]) * 60;
    }
    
    // Extract minutes
    const minMatch = lower.match(/(\d+)\s*(m|min)/);
    if (minMatch) {
      minutes += parseInt(minMatch[1]);
    }
    
    // If no time components found, assume it's just a number
    if (minutes === 0) {
      const numMatch = lower.match(/(\d+)/);
      if (numMatch) {
        minutes = parseInt(numMatch[1]);
      }
    }
    
    // Return with reasonable bounds
    return Math.max(minutes, 5); // At least 5 minutes
  } catch {
    return 30; // Default fallback: 30 minutes
  }
}

/**
 * Compute a score for a meal based on multiple factors
 * Higher score = better recommendation
 * 
 * TODO: Once we have cook time data, incorporate it into scoring
 * TODO: If we add user preferences (e.g., favorite proteins), weight those higher
 */
export function computeMealScore(meal: Meal): number {
  let score = 0;
  
  // Factor 1: Protein-to-calorie ratio (higher is better)
  const proteinPerCal = meal.calories > 0 ? (meal.protein / meal.calories) * 100 : 0;
  score += proteinPerCal * 10; // Weight protein heavily
  
  // Factor 2: Penalize very high calories (>800)
  if (meal.calories > 800) {
    score -= (meal.calories - 800) * 0.1;
  }
  
  // Factor 3: Reward moderate calories (400-600 range)
  if (meal.calories >= 400 && meal.calories <= 600) {
    score += 20;
  }
  
  // Factor 4: Shorter prep time is better
  const prepMins = parsePrepTime(meal.prepTime);
  if (prepMins > 0) {
    score += Math.max(0, 60 - prepMins) * 0.5; // Bonus for meals under 60 mins
  }
  
  // Factor 5: Health score bonus (if available)
  if (meal.healthScore) {
    score += meal.healthScore * 0.3;
  }
  
  // Factor 6: Easy meals get a small bonus
  if (meal.difficulty === 'Easy') {
    score += 10;
  } else if (meal.difficulty === 'Hard') {
    score -= 5;
  }
  
  return Math.max(score, 0); // Never return negative
}

/**
 * Get up to 2 tags for a meal based on its ranking among all meals
 */
export function getMealTags(meal: Meal, allMeals: Meal[], recommendedMealId: string): MealTag[] {
  const tags: MealTag[] = [];
  
  // Tag 1: Check if this is the recommended meal
  if (meal.id === recommendedMealId) {
    tags.push('Best match');
  }
  
  // Tag 2: Check if fastest
  const prepTimes = allMeals.map(m => parsePrepTime(m.prepTime));
  const thisPrepTime = parsePrepTime(meal.prepTime);
  const minPrepTime = Math.min(...prepTimes);
  if (thisPrepTime === minPrepTime && tags.length < 2) {
    tags.push('Fastest');
  }
  
  // Tag 3: Check if highest protein (or protein per calorie)
  const proteinPerCals = allMeals.map(m => m.calories > 0 ? m.protein / m.calories : 0);
  const thisProteinPerCal = meal.calories > 0 ? meal.protein / meal.calories : 0;
  const maxProteinPerCal = Math.max(...proteinPerCals);
  if (thisProteinPerCal === maxProteinPerCal && tags.length < 2 && !tags.includes('Best match')) {
    tags.push('High protein');
  }
  
  // Tag 4: Check if lowest calories
  const calories = allMeals.map(m => m.calories);
  const minCalories = Math.min(...calories);
  if (meal.calories === minCalories && tags.length < 2 && !tags.includes('Best match')) {
    tags.push('Lowest calories');
  }
  
  // Return max 2 tags
  return tags.slice(0, 2);
}

/**
 * Get the recommended meal (highest score)
 */
export function getRecommendedMeal(meals: Meal[]): Meal | null {
  if (meals.length === 0) return null;
  
  const scored = meals.map(meal => ({
    meal,
    score: computeMealScore(meal)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0].meal;
}

/**
 * Generate explanation for why a meal is recommended
 */
export function getRecommendationExplanation(meal: Meal, allMeals: Meal[]): string {
  const proteinPerCal = meal.calories > 0 ? (meal.protein / meal.calories) * 100 : 0;
  const avgProteinPerCal = allMeals.reduce((sum, m) => {
    return sum + (m.calories > 0 ? (m.protein / m.calories) * 100 : 0);
  }, 0) / allMeals.length;
  
  const prepMins = parsePrepTime(meal.prepTime);
  const avgPrepMins = allMeals.reduce((sum, m) => sum + parsePrepTime(m.prepTime), 0) / allMeals.length;
  
  // Generate explanation based on strongest attributes
  const reasons: string[] = [];
  
  if (proteinPerCal > avgProteinPerCal * 1.15) {
    reasons.push('highest protein per calorie');
  }
  
  if (prepMins < avgPrepMins * 0.85) {
    reasons.push('fastest to make');
  }
  
  if (meal.calories >= 400 && meal.calories <= 600) {
    reasons.push('perfectly balanced calories');
  }
  
  if (meal.difficulty === 'Easy') {
    reasons.push('easy to prepare');
  }
  
  if (reasons.length === 0) {
    return 'Best balance overall.';
  }
  
  if (reasons.length === 1) {
    return `${reasons[0].charAt(0).toUpperCase()}${reasons[0].slice(1)}.`;
  }
  
  return `${reasons[0].charAt(0).toUpperCase()}${reasons[0].slice(1)} and ${reasons[1]}.`;
}

/**
 * Sort meals by vibe filter (no network call, instant re-ranking)
 */
export function sortMealsByVibe(meals: Meal[], vibe: VibeFilter): Meal[] {
  const sorted = [...meals];
  
  switch (vibe) {
    case 'Quick':
      // Sort by prep time ascending
      sorted.sort((a, b) => parsePrepTime(a.prepTime) - parsePrepTime(b.prepTime));
      break;
      
    case 'High Protein':
      // Sort by protein per calorie descending
      sorted.sort((a, b) => {
        const aRatio = a.calories > 0 ? a.protein / a.calories : 0;
        const bRatio = b.calories > 0 ? b.protein / b.calories : 0;
        return bRatio - aRatio;
      });
      break;
      
    case 'Light':
      // Sort by calories ascending
      sorted.sort((a, b) => a.calories - b.calories);
      break;
      
    case 'Comfort':
      // Comfort food approximation: higher calories + moderate-to-high fat
      // If fat data missing, use a simple heuristic
      sorted.sort((a, b) => {
        const aComfort = (a.fat || 0) * 2 + a.calories * 0.5;
        const bComfort = (b.fat || 0) * 2 + b.calories * 0.5;
        return bComfort - aComfort;
      });
      break;
      
    default:
      // No sorting
      break;
  }
  
  return sorted;
}

/**
 * Count how many of the meal's ingredients overlap with scanned ingredients
 * Returns { count, total } for display like "Uses 7 of 10 ingredients"
 */
export function computeIngredientOverlap(
  mealIngredients: string[],
  scannedIngredients: string[]
): { count: number; total: number } {
  if (mealIngredients.length === 0 || scannedIngredients.length === 0) {
    return { count: 0, total: mealIngredients.length };
  }
  
  // Normalize for comparison (lowercase, trim)
  const scannedNormalized = new Set(
    scannedIngredients.map(ing => ing.toLowerCase().trim())
  );
  
  let matchCount = 0;
  for (const ingredient of mealIngredients) {
    const normalized = ingredient.toLowerCase().trim();
    // Check exact match or if scanned ingredient is contained in meal ingredient
    if (scannedNormalized.has(normalized)) {
      matchCount++;
    } else {
      // Check for partial matches (e.g., "chicken breast" matches "chicken")
      for (const scanned of scannedNormalized) {
        if (normalized.includes(scanned) || scanned.includes(normalized)) {
          matchCount++;
          break;
        }
      }
    }
  }
  
  return { count: matchCount, total: mealIngredients.length };
}
