import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Camera, Sparkles, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import {
  getInventoryItems,
  getInventoryDoc,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  normalizeIngredientName,
  toTitleCase,
} from '../../lib/inventory';
import type { InventoryItem, InventoryDoc } from '@plately/shared';
import { categorizeFood } from '../../utils/foodCategorization';

// Category order for display
const CATEGORY_ORDER = [
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
];

// ============================================================================
// INVENTORY EDITOR COMPONENT
// ============================================================================

type InventoryEditorProps = {
  items: (InventoryItem & { id: string })[];
  inventoryDoc: InventoryDoc | null;
  onAddItem: (item: Omit<InventoryItem, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onRescan: () => void;
  onGenerateMeals: () => void;
  loading?: boolean;
};

function InventoryEditor({ items, inventoryDoc, onAddItem, onUpdateItem, onDeleteItem, onRescan, onGenerateMeals, loading }: InventoryEditorProps) {
  const [newItemName, setNewItemName] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [showSavedCheck, setShowSavedCheck] = useState(false);

  const handleAddItem = async () => {
    const trimmed = newItemName.trim();
    if (!trimmed || addingItem) return;

    // Check for duplicates
    const normalized = normalizeIngredientName(trimmed);
    const exists = items.some(item => normalizeIngredientName(item.name) === normalized);

    if (exists) {
      alert('This item is already in your inventory!');
      return;
    }

    setAddingItem(true);
    try {
      // Auto-categorize with existing AI logic
      const titleCased = toTitleCase(trimmed);
      const categoryResult = await categorizeFood(titleCased, 'http://localhost:5000');

      await onAddItem({
        name: titleCased,
        source: 'user',
        category: categoryResult.category || 'Other',
        quantity: undefined,
        unit: undefined,
        confidence: undefined,
        expiresAt: undefined,
      });

      setNewItemName('');
      setShowSavedCheck(true);
      setTimeout(() => setShowSavedCheck(false), 2000);
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await onDeleteItem(itemId);
      setShowSavedCheck(true);
      setTimeout(() => setShowSavedCheck(false), 2000);
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleUpdateItemName = async (itemId: string, newName: string) => {
    try {
      // Re-categorize on name change
      const categoryResult = await categorizeFood(newName, 'http://localhost:5000');
      await onUpdateItem(itemId, {
        name: newName,
        category: categoryResult.category || 'Other',
      });
      setShowSavedCheck(true);
      setTimeout(() => setShowSavedCheck(false), 2000);
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const formatDate = (date: Date | { toDate: () => Date } | undefined) => {
    if (!date) return 'Not scanned yet';
    const actualDate = typeof date === 'object' && 'toDate' in date ? date.toDate() : date;
    const parsedDate = new Date(actualDate);
    if (isNaN(parsedDate.getTime())) return 'Not scanned yet';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsedDate);
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, (InventoryItem & { id: string })[]>);

  return (
    <div className="space-y-6">
      {/* Last Scan Info */}
      {inventoryDoc?.lastScannedAt && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Last scanned: {formatDate(inventoryDoc.lastScannedAt)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} in inventory
              </p>
            </div>
            {showSavedCheck && (
              <div className="flex items-center gap-1 text-[#2ECC71]">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Saved</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Item */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-[#2C2C2C]">Add New Item</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem();
              }
            }}
            placeholder="Enter ingredient name..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          />
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Items List - Grouped by Category */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-[#2C2C2C]">Your Ingredients</h3>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No ingredients yet. Add some above or scan your fridge!
          </p>
        ) : (
          <div className="space-y-6">
            {CATEGORY_ORDER.filter(category => groupedItems[category]?.length > 0).map(category => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#2ECC71]"></span>
                  {category}
                  <span className="text-xs font-normal text-gray-500 ml-1">({groupedItems[category].length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupedItems[category].map((item) => (
                    <div
                      key={item.id}
                      className="relative flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#2ECC71] transition-all group"
                    >
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                        className="flex-1 px-2 py-1 border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#2ECC71] rounded text-sm font-medium min-w-0"
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded whitespace-nowrap">
                          {item.source === 'ai' ? 'AI' : 'User'}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary CTA: Generate Meals */}
        <button
          onClick={onGenerateMeals}
          disabled={items.length === 0}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            items.length > 0
              ? 'bg-[#2ECC71] text-white hover:bg-[#27AE60] shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          {items.length === 0 ? 'Add Items First' : 'Generate Meals from Inventory'}
        </button>

        {/* Secondary Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRescan}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-white border-2 border-[#2ECC71] text-[#2ECC71] rounded-lg font-semibold hover:bg-[#2ECC71] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Rescan Fridge
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// INVENTORY PAGE (Main Container)
// ============================================================================

export function InventoryPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<(InventoryItem & { id: string })[]>([]);
  const [inventoryDoc, setInventoryDoc] = useState<InventoryDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', '/inventory');
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  // Load inventory on mount
  useEffect(() => {
    if (!user) return;

    const loadInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const [itemsData, docData] = await Promise.all([
          getInventoryItems(user.uid),
          getInventoryDoc(user.uid),
        ]);
        setItems(itemsData);
        setInventoryDoc(docData);
      } catch (err) {
        console.error('Failed to load inventory:', err);
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [user]);

  const handleAddItem = async (item: Omit<InventoryItem, 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    await addInventoryItem(user.uid, item);
    // Reload items to get the new one with ID
    const updatedItems = await getInventoryItems(user.uid);
    setItems(updatedItems);
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<InventoryItem>) => {
    if (!user) return;
    
    await updateInventoryItem(user.uid, itemId, updates);
    // Update local state
    setItems(prevItems =>
      prevItems.map(item => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    
    await deleteInventoryItem(user.uid, itemId);
    // Update local state
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleRescan = () => {
    navigate('/upload');
  };

  const handleGenerateMeals = () => {
    if (items.length === 0) return;

    // Navigate directly to review page with full inventory items (including categories)
    const inventoryItems = items.map(item => ({
      name: item.name,
      category: item.category || 'Other',
    })).filter(item => item.name);
    
    navigate('/review', {
      state: {
        fromInventory: true,
        inventoryItems: inventoryItems,
      },
    });
  };

  const handleStartScanning = () => {
    navigate('/upload');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#2ECC71] mx-auto mb-4" />
          <p className="text-gray-600">Loading your inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING STATE: No inventory yet
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9FAF7] flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-20 h-20 bg-[#2ECC71]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-[#2ECC71]" />
            </div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-3">
              No Saved Inventory
            </h2>
            <p className="text-gray-600 mb-6">
              Scan your fridge once and we'll remember your ingredients for next time!
            </p>
            <button
              onClick={handleStartScanning}
              className="w-full py-3 bg-[#2ECC71] text-white rounded-lg font-semibold hover:bg-[#27AE60] transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Scan Your Fridge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN INVENTORY EDITOR VIEW
  return (
    <div className="min-h-screen bg-[#F9FAF7] py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-2">
            Saved Inventory
          </h1>
          <p className="text-gray-600">
            Edit your ingredients or rescan when you need to update
          </p>
        </div>

        <InventoryEditor
          items={items}
          inventoryDoc={inventoryDoc}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onRescan={handleRescan}
          onGenerateMeals={handleGenerateMeals}
          loading={loading}
        />
      </div>
    </div>
  );
}
