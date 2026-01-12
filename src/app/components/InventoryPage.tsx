import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Camera, Loader2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import {
  getCurrentInventory,
  updateInventoryItems,
  type Inventory,
  type InventoryItem,
  normalizeIngredientName,
} from '../../lib/inventory';

// ============================================================================
// INVENTORY EDITOR COMPONENT (Pure UI)
// ============================================================================

type InventoryEditorProps = {
  inventory: Inventory;
  onSave: (items: InventoryItem[]) => Promise<void>;
  onRescan: () => void;
  onGenerateMeals: () => void;
  loading?: boolean;
};

function InventoryEditor({ inventory, onSave, onRescan, onGenerateMeals, loading }: InventoryEditorProps) {
  const [items, setItems] = useState<InventoryItem[]>(inventory.items);
  const [newItemName, setNewItemName] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const itemsChanged =
      items.length !== inventory.items.length ||
      !items.every(item => {
        const original = inventory.items.find(i => i.id === item.id);
        return original && original.name === item.name;
      });
    setHasChanges(itemsChanged);
  }, [items, inventory.items]);

  const handleAddItem = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;

    // Check for duplicates
    const normalized = normalizeIngredientName(trimmed);
    const exists = items.some(item => normalizeIngredientName(item.name) === normalized);

    if (exists) {
      alert('This item is already in your inventory!');
      return;
    }

    const newItem: InventoryItem = {
      id: `user_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: trimmed,
      addedBy: 'user',
      updatedAt: new Date(),
    };

    setItems([...items, newItem]);
    setNewItemName('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItemName = (id: string, newName: string) => {
    setItems(
      items.map(item =>
        item.id === id
          ? { ...item, name: newName, updatedAt: new Date() }
          : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(items);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save inventory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Last Scan Info */}
      {inventory.lastScan && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            {inventory.lastScan.photoUrl && (
              <img
                src={inventory.lastScan.photoUrl}
                alt="Last scan"
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Last scanned: {formatDate(inventory.lastScan.scannedAt)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'} in inventory
              </p>
            </div>
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

      {/* Items List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-[#2C2C2C]">Your Ingredients</h3>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No ingredients yet. Add some above or scan your fridge!
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                  className="flex-1 px-2 py-1 border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#2ECC71] rounded"
                />
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                  {item.addedBy === 'ai' ? 'AI' : 'Manual'}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
          disabled={items.length === 0 || hasChanges}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            items.length > 0 && !hasChanges
              ? 'bg-[#2ECC71] text-white hover:bg-[#27AE60] shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          {hasChanges ? 'Save Changes First' : items.length === 0 ? 'Add Items First' : 'Generate Meals from Inventory'}
        </button>

        {/* Secondary Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              hasChanges && !saving
                ? 'bg-[#2ECC71] text-white hover:bg-[#27AE60]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {hasChanges ? 'Save Changes' : 'No Changes'}
              </>
            )}
          </button>

          <button
            onClick={onRescan}
            disabled={loading}
            className="px-6 py-3 bg-white border-2 border-[#2ECC71] text-[#2ECC71] rounded-lg font-semibold hover:bg-[#2ECC71] hover:text-white transition-colors flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Rescan
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
  const [inventory, setInventory] = useState<Inventory | null>(null);
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
        const data = await getCurrentInventory(user.uid);
        setInventory(data);
      } catch (err) {
        console.error('Failed to load inventory:', err);
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [user]);

  const handleSave = async (items: InventoryItem[]) => {
    if (!user) return;

    try {
      await updateInventoryItems(user.uid, items);
      // Refresh inventory
      const updated = await getCurrentInventory(user.uid);
      setInventory(updated);
    } catch (err) {
      throw err;
    }
  };

  const handleRescan = () => {
    navigate('/upload');
  };

  const handleGenerateMeals = () => {
    if (!inventory || inventory.items.length === 0) return;

    // Navigate to loading page with inventory ingredients
    const ingredientNames = inventory.items.map(item => item.name).filter(Boolean);
    
    // Store in sessionStorage for fallback
    try {
      sessionStorage.setItem('plately:lastIngredients', JSON.stringify(ingredientNames));
    } catch {
      // ignore
    }

    navigate('/loading', {
      state: {
        ingredients: ingredientNames,
        goal: 'maintain', // Default goal, user can change in future
        filters: [],
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
  if (!inventory || inventory.items.length === 0) {
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
          inventory={inventory}
          onSave={handleSave}
          onRescan={handleRescan}
          onGenerateMeals={handleGenerateMeals}
          loading={loading}
        />
      </div>
    </div>
  );
}
