import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSales,
  useCreateSale,
  useDeleteSale,
  getGetSalesQueryKey,
} from "@workspace/api-client-react";
import {
  TrendingUp,
  Plus,
  Trash2,
  DollarSign,
  ShoppingBag,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Sales() {
  const qc = useQueryClient();
  const { data: sales = [], isLoading } = useGetSales();
  const createMutation = useCreateSale();
  const deleteMutation = useDeleteSale();

  const [form, setForm] = useState({ product: "", quantity: "", revenue: "" });

  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const avgRevenue = sales.length > 0 ? totalRevenue / sales.length : 0;

  // Group sales by date for chart
  const chartData = Object.entries(
    sales.reduce<Record<string, number>>((acc, s) => {
      const d = s.createdAt.slice(0, 10);
      acc[d] = (acc[d] || 0) + s.revenue;
      return acc;
    }, {})
  )
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          product: form.product,
          quantity: parseInt(form.quantity),
          revenue: parseFloat(form.revenue),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetSalesQueryKey() });
          setForm({ product: "", quantity: "", revenue: "" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetSalesQueryKey() }),
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">Revenue tracking and demand analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-emerald-400">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Transactions", value: String(sales.length), icon: ShoppingBag, color: "text-primary" },
          { label: "Units Sold", value: totalQuantity.toLocaleString(), icon: Package, color: "text-accent" },
          { label: "Avg Revenue", value: `$${avgRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
            <Icon className={`w-8 h-8 ${color} opacity-30`} />
          </div>
        ))}
      </div>

      {/* Revenue trend chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Revenue Trend (last 14 days)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(220,27%,11%)", border: "1px solid hsl(220,30%,20%)", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              />
              <Area type="monotone" dataKey="value" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Sale Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Record Sale
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {[
              { label: "Product", key: "product", type: "text", placeholder: "e.g. QPU Chips" },
              { label: "Quantity Sold", key: "quantity", type: "number", placeholder: "e.g. 25" },
              { label: "Revenue ($)", key: "revenue", type: "number", placeholder: "e.g. 45000" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
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
              className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Recording..." : "Record Sale"}
            </button>
          </form>
        </div>

        {/* Sales List */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Sales History ({sales.length})
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-muted/30 rounded-lg" />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No sales recorded. Add your first sale.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-auto max-h-[500px]">
              {[...sales].reverse().map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sale.product}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">Qty: {sale.quantity}</span>
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <DollarSign className="w-3 h-3" />
                        {sale.revenue.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {sale.createdAt.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-4"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
