import { useGetDashboardSummary, useGetDashboardTrends } from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DollarSign, Users, TrendingUp, Zap, Package, AlertTriangle, ShoppingBag } from "lucide-react";

function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  color = "primary",
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "primary" | "purple" | "green" | "orange" | "red";
  delta?: string;
}) {
  const colors = {
    primary: "text-primary border-primary/20 bg-primary/5",
    purple: "text-accent border-accent/20 bg-accent/5",
    green: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    orange: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    red: "text-red-400 border-red-400/20 bg-red-400/5",
  };
  const iconColors = {
    primary: "text-primary",
    purple: "text-accent",
    green: "text-emerald-400",
    orange: "text-orange-400",
    red: "text-red-400",
  };

  return (
    <div className={`rounded-xl border p-5 bg-card relative overflow-hidden ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
          <p className={`text-2xl font-bold ${iconColors[color]}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          {delta && (
            <p className="text-xs text-emerald-400 mt-1">+{delta} from last period</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-30`} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
            {p.name}: ${p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: trends, isLoading: trendsLoading } = useGetDashboardTrends();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time enterprise intelligence dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary font-medium">Live Data</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-28" />
          ))
        ) : (
          <>
            <KPICard
              label="Inventory Value"
              value={`$${((summary?.totalInventoryValue ?? 0) / 1000).toFixed(0)}k`}
              sub={`${summary?.inventoryItems ?? 0} products tracked`}
              icon={Package}
              color="primary"
            />
            <KPICard
              label="Active Suppliers"
              value={String(summary?.activeSuppliers ?? 0)}
              sub="Quantum-optimized network"
              icon={Users}
              color="purple"
            />
            <KPICard
              label="Sales Revenue"
              value={`$${((summary?.salesRevenue ?? 0) / 1000).toFixed(0)}k`}
              sub={`${summary?.totalSales ?? 0} transactions`}
              icon={ShoppingBag}
              color="green"
            />
            <KPICard
              label="Quantum Savings"
              value={`$${((summary?.optimizationSavings ?? 0) / 1000).toFixed(0)}k`}
              sub="vs classical procurement"
              icon={Zap}
              color="orange"
            />
            <div className="col-span-2 lg:col-span-1">
              <KPICard
                label="Low Stock Alerts"
                value={String(summary?.lowStockItems ?? 0)}
                sub="Items below threshold"
                icon={AlertTriangle}
                color={(summary?.lowStockItems ?? 0) > 2 ? "red" : "green"}
              />
            </div>
            <div className="col-span-2 lg:col-span-3">
              <div className="rounded-xl border border-border bg-card p-4 h-full flex items-center gap-6">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Quantum Advantage</p>
                  <p className="text-sm text-foreground font-medium">
                    18% cost reduction vs classical greedy algorithm. QAOA optimization running on {summary?.activeSuppliers ?? 0} qubits.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary neon-text">18%</p>
                  <p className="text-xs text-muted-foreground">improvement</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sales Revenue</h3>
              <p className="text-xs text-muted-foreground mt-0.5">30-day trend</p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          {trendsLoading ? (
            <div className="h-48 animate-pulse bg-muted/30 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trends?.salesTrend ?? []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Revenue"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory Trend */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Inventory Valuation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">7-day trend</p>
            </div>
            <Package className="w-4 h-4 text-accent" />
          </div>
          {trendsLoading ? (
            <div className="h-48 animate-pulse bg-muted/30 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trends?.inventoryTrend ?? []}>
                <defs>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Inventory Value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#invGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cost Comparison */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Quantum vs Classical Cost</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Optimization comparison over 6 runs</p>
            </div>
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          {trendsLoading ? (
            <div className="h-48 animate-pulse bg-muted/30 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trends?.costComparison ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Quantum Cost" fill="#00d4ff" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
