import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  getGetInventoryQueryKey,
} from "@workspace/api-client-react";
import { Package, Plus, Trash2, Edit3, AlertTriangle, CheckCircle, DollarSign, X } from "lucide-react";

interface EditForm {
  name: string;
  quantity: string;
  cost: string;
  lowStockThreshold: string;
}

export default function Inventory() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useGetInventory();
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();

  const [form, setForm] = useState<EditForm>({ name: "", quantity: "", cost: "", lowStockThreshold: "10" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", quantity: "", cost: "", lowStockThreshold: "10" });

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.cost, 0);
  const lowStockItems = items.filter((i) => i.quantity <= i.lowStockThreshold);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          name: form.name,
          quantity: parseInt(form.quantity),
          cost: parseFloat(form.cost),
          lowStockThreshold: parseInt(form.lowStockThreshold),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
          setForm({ name: "", quantity: "", cost: "", lowStockThreshold: "10" });
        },
      }
    );
  };

  const startEdit = (item: { id: number; name: string; quantity: number; cost: number; lowStockThreshold: number }) => {
    setEditId(item.id);
    setEditForm({
      name: item.name,
      quantity: String(item.quantity),
      cost: String(item.cost),
      lowStockThreshold: String(item.lowStockThreshold),
    });
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate(
      {
        id,
        data: {
          name: editForm.name,
          quantity: parseInt(editForm.quantity),
          cost: parseFloat(editForm.cost),
          lowStockThreshold: parseInt(editForm.lowStockThreshold),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
          setEditId(null);
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetInventoryQueryKey() }),
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage quantum components</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-xl font-bold text-primary neon-text">${totalValue.toLocaleString()}</p>
          </div>
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">{lowStockItems.length} Low Stock</span>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Alerts
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-xs text-red-300 font-medium">{item.name}</span>
                <span className="text-xs text-red-400">({item.quantity}/{item.lowStockThreshold})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add Product
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {[
              { label: "Product Name", key: "name", type: "text", placeholder: "e.g. QPU Chips" },
              { label: "Quantity", key: "quantity", type: "number", placeholder: "e.g. 100" },
              { label: "Unit Cost ($)", key: "cost", type: "number", placeholder: "e.g. 1200" },
              { label: "Low Stock Threshold", key: "lowStockThreshold", type: "number", placeholder: "e.g. 10" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof EditForm]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Adding..." : "Add Product"}
            </button>
          </form>
        </div>

        {/* Inventory Table */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Products ({items.length})
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse bg-muted/30 rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No inventory items. Add your first product.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-auto max-h-[500px]">
              {items.map((item) => {
                const isLow = item.quantity <= item.lowStockThreshold;
                const isEditing = editId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      isLow ? "border-red-500/30 bg-red-500/5" : "border-border bg-muted/20"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {(["name", "quantity", "cost", "lowStockThreshold"] as const).map((key) => (
                            <input
                              key={key}
                              type={key === "name" ? "text" : "number"}
                              value={editForm[key]}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                              placeholder={key}
                              className="bg-muted/40 border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50"
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="flex-1 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="px-3 py-1.5 rounded bg-muted text-muted-foreground text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            {isLow ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">
                              Qty:{" "}
                              <span className={isLow ? "text-red-400 font-medium" : "text-foreground"}>
                                {item.quantity}
                              </span>{" "}
                              / {item.lowStockThreshold} min
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="w-3 h-3" />
                              {item.cost.toLocaleString()} each
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Value:{" "}
                              <span className="text-primary font-medium">
                                ${(item.quantity * item.cost).toLocaleString()}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
