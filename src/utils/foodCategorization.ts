// PlatelyAI Food Categorization System
// Three-layer approach: Keyword → AI → User

export const CORE_CATEGORIES = [
  "Produce",
  "Meat",
  "Dairy",
  "Grains",
  "Pantry",
  "Frozen",
  "Snacks",
  "Beverages",
  "Condiments",
  "Other"
] as const;

const QUICK_MAP: Record<string, string> = {
  // Meat
  chicken: "Meat",
  beef: "Meat",
  steak: "Meat",
  pork: "Meat",
  turkey: "Meat",
  lamb: "Meat",
  fish: "Meat",
  salmon: "Meat",
  tuna: "Meat",
  shrimp: "Meat",
  bacon: "Meat",
  sausage: "Meat",
  ham: "Meat",
  duck: "Meat",
  veal: "Meat",
  ground: "Meat",
  ribs: "Meat",
  
  // Dairy
  milk: "Dairy",
  cheese: "Dairy",
  yogurt: "Dairy",
  butter: "Dairy",
  cream: "Dairy",
  
  // Produce
  apple: "Produce",
  banana: "Produce",
  orange: "Produce",
  tomato: "Produce",
  lettuce: "Produce",
  carrot: "Produce",
  onion: "Produce",
  potato: "Produce",
  broccoli: "Produce",
  spinach: "Produce",
  cucumber: "Produce",
  pepper: "Produce",
  
  // Grains
  rice: "Grains",
  pasta: "Grains",
  bread: "Grains",
  cereal: "Grains",
  oats: "Grains",
  quinoa: "Grains",
  
  // Beverages
  soda: "Beverages",
  juice: "Beverages",
  coffee: "Beverages",
  tea: "Beverages",
  water: "Beverages",
  
  // Condiments
  ketchup: "Condiments",
  mustard: "Condiments",
  mayo: "Condiments",
  sauce: "Condiments",
  dressing: "Condiments",
  
  // Pantry
  oil: "Pantry",
  flour: "Pantry",
  sugar: "Pantry",
  salt: "Pantry",
  
  // Frozen
  frozen: "Frozen",
  
  // Snacks
  chips: "Snacks",
  crackers: "Snacks",
  cookies: "Snacks",
  candy: "Snacks",
};

export function quickCategory(foodName: string): string | null {
  const lower = foodName.toLowerCase();
  for (const key in QUICK_MAP) {
    if (lower.includes(key)) {
      return QUICK_MAP[key];
    }
  }
  return null;
}

export async function categorizeFoodWithAI(
  foodName: string,
  backendUrl: string
): Promise<string> {
  try {
    const response = await fetch(`${backendUrl}/api/categorize-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.warn('AI categorization failed:', data);
      return 'Other';
    }

    return data.category || 'Other';
  } catch (error) {
    console.error('Error calling AI categorization:', error);
    return 'Other';
  }
}

export async function categorizeFood(
  foodName: string,
  backendUrl: string
): Promise<{ category: string; source: 'keyword' | 'ai'; confidence: 'high' | 'medium' | 'low' }> {
  // Layer 1: Try keyword mapping (fast, free)
  const keywordResult = quickCategory(foodName);
  if (keywordResult) {
    return {
      category: keywordResult,
      source: 'keyword',
      confidence: 'high',
    };
  }

  // Layer 2: AI fallback (cheap text-only)
  const aiResult = await categorizeFoodWithAI(foodName, backendUrl);
  
  return {
    category: aiResult,
    source: 'ai',
    confidence: aiResult === 'Other' ? 'low' : 'medium',
  };
}
