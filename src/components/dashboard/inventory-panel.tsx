"use client";

import React, { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/currency";
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  ArrowUpRight, 
  CheckCircle2,
  XCircle,
  TrendingDown,
  Layers
} from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  category: string; // e.g. "Chemicals", "Towels", "Equipment", "Supplies"
  quantity: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplier: string | null;
  lastRestocked: string | null;
};

interface InventoryPanelProps {
  initialItems: InventoryItem[];
  stationId: string;
}

export function InventoryPanel({ initialItems, stationId }: InventoryPanelProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Chemicals");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("Liters");
  const [minThreshold, setMinThreshold] = useState("5");
  const [costPerUnit, setCostPerUnit] = useState("450");
  const [supplier, setSupplier] = useState("AutoShine Supplies Co.");

  const categories = ["ALL", "Chemicals", "Towels", "Equipment", "Supplies"];

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;
  const totalValuation = items.reduce((sum, i) => sum + i.quantity * i.costPerUnit, 0);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId,
            name,
            sku: sku || null,
            category,
            quantity: Number(quantity),
            unit,
            minThreshold: Number(minThreshold),
            costPerUnit: Number(costPerUnit),
            supplier: supplier || null,
          }),
        });
        if (res.ok) {
          const newItem = await res.json();
          setItems((prev) => [newItem, ...prev]);
          setModalOpen(false);
          // reset
          setName("");
          setSku("");
        }
      } catch (err) {
        console.error("Failed to add inventory item", err);
      }
    });
  };

  const handleUpdateStock = async (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty, lastRestocked: delta > 0 ? new Date().toISOString() : i.lastRestocked };
        }
        return i;
      })
    );

    try {
      await fetch(`/api/inventory/${itemId}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
    } catch (err) {
      console.error("Failed to update inventory stock", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Package className="text-blue-600" size={22} />
            Supplies & Bay Equipment Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track detailing chemicals, microfiber supplies, spare parts, and receive low-stock restocking warnings.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all active-tap"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Inventory Item
        </button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total SKUs</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{items.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Alerts</p>
            <p className={`text-2xl font-black mt-0.5 ${lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {lowStockCount} {lowStockCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory Valuation</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{formatCurrency(totalValuation)}</p>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKUs, chemical names, or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Package className="mx-auto text-slate-300" size={36} />
            <p className="text-sm font-bold text-slate-600">No inventory supplies matching this criteria.</p>
            <p className="text-xs text-slate-400">Click "Add Inventory Item" above to add new stock.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden md:grid grid-cols-[180px_130px_140px_130px_1fr] gap-4 px-6 py-3 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              <span>Item & Category</span>
              <span>Stock Quantity</span>
              <span>Threshold Status</span>
              <span>Unit Cost</span>
              <span className="text-right">Quick Adjust</span>
            </div>

            {filteredItems.map((item) => {
              const isLow = item.quantity <= item.minThreshold;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-[180px_130px_140px_130px_1fr] gap-3 md:gap-4 px-5 py-4 md:px-6 items-center hover:bg-slate-50/50 transition-colors text-xs"
                >
                  {/* Item name & category */}
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-800 text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-600 uppercase">
                        {item.category}
                      </span>
                      {item.sku && (
                        <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
                      )}
                    </div>
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <span className="text-base font-black text-slate-800">{item.quantity}</span>{" "}
                    <span className="text-[11px] font-bold text-slate-400">{item.unit}</span>
                  </div>

                  {/* Threshold Status */}
                  <div>
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wide">
                        <AlertTriangle size={12} /> Low Stock (Min: {item.minThreshold})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wide">
                        <CheckCircle2 size={12} /> Optimal Stock
                      </span>
                    )}
                  </div>

                  {/* Unit Cost */}
                  <div className="font-bold text-slate-700">
                    {formatCurrency(item.costPerUnit)} <span className="text-[10px] text-slate-400">/ {item.unit}</span>
                  </div>

                  {/* Quick Adjust */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                    <button
                      onClick={() => handleUpdateStock(item.id, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 font-extrabold flex items-center justify-center transition-colors text-sm"
                      title="Consume 1 Unit"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleUpdateStock(item.id, 5)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200 transition-colors"
                    >
                      +5 Restock
                    </button>
                    <button
                      onClick={() => handleUpdateStock(item.id, 10)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200 transition-colors"
                    >
                      +10 Restock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">Add Inventory SKU / Supply</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Meguiar's High Gloss Foam Wash"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. CHEM-FOAM-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Chemicals">Chemicals & Shampoos</option>
                    <option value="Towels">Microfiber Towels & Applicators</option>
                    <option value="Equipment">Bay Equipment & Spare Parts</option>
                    <option value="Supplies">General Station Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit Type</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. Liters, Pieces, Bottles"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Alert Qty</label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit Cost</label>
                  <input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. AutoShine Wholesale Pvt Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-colors"
                >
                  Save SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
