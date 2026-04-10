import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetQuantumStatus,
  useGetSuppliers,
  useRunQuantumOptimization,
  getGetQuantumStatusQueryKey,
} from "@workspace/api-client-react";
import { useQuantum } from "@/lib/quantum-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Atom,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  Loader2,
  Terminal,
  BarChart2,
  TrendingDown,
  GitBranch,
  Shield,
  Clock,
} from "lucide-react";

const QUANTUM_STEPS = [
  { label: "Initializing qubits in |0⟩ state", icon: "⊙" },
  { label: "Applying Hadamard gates → |+⟩ superposition", icon: "H" },
  { label: "Entangling qubits via CNOT gates", icon: "⊕" },
  { label: "Encoding cost Hamiltonian via RZ rotations", icon: "R" },
  { label: "Running COBYLA optimization loop", icon: "↻" },
  { label: "Converging variational parameters", icon: "~" },
  { label: "Final measurement — collapsing quantum state", icon: "M" },
];

function MetricCard({ label, value, icon, color = "text-primary" }: {
  label: string; value: string | number; icon: string; color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
        <span className="text-lg font-mono text-muted-foreground">{icon}</span>
      </div>
      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

export default function QuantumLab() {
  const qc = useQueryClient();
  const { lastResult, setLastResult } = useQuantum();
  const { data: status } = useGetQuantumStatus();
  const { data: suppliers = [] } = useGetSuppliers();
  const optimizeMutation = useRunQuantumOptimization();

  const [stepIdx, setStepIdx] = useState(-1);
  const [budget, setBudget] = useState("100000");
  const [algorithm, setAlgorithm] = useState("auto");

  const isRunning = stepIdx >= 0;

  const runDemo = async () => {
    if (suppliers.length === 0) return;
    setStepIdx(0);

    const interval = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= QUANTUM_STEPS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    try {
      const result = await new Promise<typeof lastResult>((resolve, reject) => {
        optimizeMutation.mutate(
          {
            data: {
              supplierIds: suppliers.map((s) => s.id),
              budget: parseFloat(budget),
              algorithm: algorithm === "auto" ? undefined : algorithm,
            },
          },
          {
            onSuccess: (data) => resolve(data as typeof lastResult),
            onError: reject,
          }
        );
      });
      clearInterval(interval);
      setStepIdx(-1);
      if (result) setLastResult(result);
    } catch (err) {
      clearInterval(interval);
      setStepIdx(-1);
    }
  };

  const result = lastResult;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Atom className="w-6 h-6 text-primary quantum-pulse" />
            Quantum Insights Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real quantum circuit execution via Qiskit Aer Simulator
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${status?.available ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted/10 border-border"}`}>
          <div className={`w-2 h-2 rounded-full ${status?.available ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
          <span className={`text-xs font-medium ${status?.available ? "text-emerald-400" : "text-muted-foreground"}`}>
            {status?.available ? `Qiskit ${status.version} Ready` : "Initializing..."}
          </span>
        </div>
      </div>

      {/* Status bar */}
      {status?.message && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Activity className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary/80">{status.message}</p>
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Run Quantum Optimization</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Budget ($)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground w-36 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground w-40 focus:outline-none focus:border-primary/50"
            >
              <option value="auto">Auto-Select</option>
              <option value="qaoa">QAOA</option>
              <option value="vqe">VQE</option>
              <option value="grover">Grover's Search</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Suppliers loaded</label>
            <div className="px-3 py-2 rounded-lg bg-muted/20 border border-border text-sm text-foreground">
              {suppliers.length} qubits
            </div>
          </div>
          <button
            onClick={runDemo}
            disabled={isRunning || suppliers.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 quantum-glow"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isRunning ? "Computing..." : "Execute Quantum Circuit"}
          </button>
        </div>
      </div>

      {/* Live Quantum Animation */}
      {isRunning && (
        <div className="rounded-xl border border-primary/40 bg-black/40 p-6 quantum-glow">
          <div className="flex items-center gap-3 mb-5">
            <Atom className="w-5 h-5 text-primary animate-spin" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Quantum Circuit Executing</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {QUANTUM_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 py-2 px-3 rounded-lg transition-all duration-500 ${
                  i === stepIdx
                    ? "bg-primary/10 border border-primary/30"
                    : i < stepIdx
                    ? "opacity-50"
                    : "opacity-20"
                }`}
              >
                <span className={`font-mono text-lg w-8 text-center ${i <= stepIdx ? "text-primary" : "text-muted-foreground"}`}>
                  {step.icon}
                </span>
                <span className={`text-sm ${i === stepIdx ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
                {i < stepIdx && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                {i === stepIdx && <div className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isRunning && (
        <div className="space-y-6">
          {/* Algorithm Selection */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <GitBranch className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-accent">
                  Selected Algorithm: {result.algorithmUsed}
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">{result.algorithmReason}</p>
                <p className="text-xs text-primary mt-2 font-medium">
                  This result is generated using real quantum computation via Qiskit.
                </p>
              </div>
            </div>
          </div>

          {/* Quantum Metrics */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Quantum Circuit Metrics
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricCard label="Qubits" value={result.quantumMetrics.qubits} icon="⊙" color="text-primary" />
              <MetricCard label="Circuit Depth" value={result.quantumMetrics.depth} icon="↕" color="text-accent" />
              <MetricCard label="Shots" value={result.quantumMetrics.shots} icon="→" color="text-emerald-400" />
              <MetricCard label="Backend" value={result.quantumMetrics.backend} icon="□" color="text-orange-400" />
              <MetricCard label="Execution Time" value={result.quantumMetrics.executionTime} icon="⏱" color="text-blue-400" />
            </div>
          </div>

          {/* Circuit Diagram */}
          <div className="rounded-xl border border-border bg-black/60 p-6">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Quantum Circuit Diagram
            </h2>
            <div className="overflow-auto">
              <pre className="text-xs text-primary/90 font-mono leading-relaxed whitespace-pre">
                {result.circuitDiagram || "Circuit diagram not available"}
              </pre>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Quantum Cost</p>
              <p className="text-2xl font-bold text-emerald-400">${result.totalCost.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Classical Cost</p>
              <p className="text-2xl font-bold text-muted-foreground">${result.classicalCost.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Improvement</p>
                  <p className="text-2xl font-bold text-orange-400">{result.improvement}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-400/40" />
              </div>
            </div>
          </div>

          {/* Best Solution + Confidence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary/20 bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Best Bitstring Solution</p>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-mono text-primary tracking-widest">
                  {result.bestSolution.split("").map((bit, i) => (
                    <span key={i} className={bit === "1" ? "text-primary neon-text" : "text-muted-foreground"}>
                      {bit}
                    </span>
                  ))}
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {result.selectedSuppliers.map((s) => s.name).join(", ") || "None"}
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Confidence Score</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-primary">{(result.confidence * 100).toFixed(1)}%</p>
                <Shield className="w-6 h-6 text-primary/40" />
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted/30">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Probability Histogram */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                Measurement Probability Distribution
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={result.probabilities.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="bitstring" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} angle={-30} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220,27%,11%)", border: "1px solid hsl(220,30%,20%)", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(v: number) => [`${(v * 100).toFixed(2)}%`, "Probability"]}
                  />
                  <Bar dataKey="probability" name="Probability" fill="#00d4ff" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Convergence Graph */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Optimization Convergence
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.convergence}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="iteration" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} label={{ value: "Iteration", position: "insideBottom", offset: -2, fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220,27%,11%)", border: "1px solid hsl(220,30%,20%)", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Line type="monotone" dataKey="cost" name="Cost" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Statevector Amplitudes */}
          {result.statevectorAmplitudes && result.statevectorAmplitudes.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                Statevector Probability Amplitudes |ψ|²
              </h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={result.statevectorAmplitudes.slice(0, 32).map((v, i) => ({ state: `|${i.toString(2).padStart(result.quantumMetrics.qubits, "0")}⟩`, amplitude: v }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="state" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }} interval={3} />
                  <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220,27%,11%)", border: "1px solid hsl(220,30%,20%)", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Bar dataKey="amplitude" name="|ψ|²" fill="#f97316" radius={[2, 2, 0, 0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quantum vs Classical Comparison */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Quantum vs Classical Cost Comparison
            </h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={[
                  { name: "Quantum Optimized", cost: result.totalCost },
                  { name: "Classical Greedy", cost: result.classicalCost },
                ]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220,27%,11%)", border: "1px solid hsl(220,30%,20%)", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Cost"]}
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {[
                    { fill: "#00d4ff" },
                    { fill: "#6b7280" },
                  ].map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-xs text-primary font-medium">
              This result is generated using real quantum computation via Qiskit. Circuit executed on aer_simulator with {result.quantumMetrics.shots} shots.
            </p>
          </div>
        </div>
      )}

      {!result && !isRunning && (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <Atom className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm mb-2">No quantum results yet</p>
          <p className="text-xs opacity-60">Add suppliers in Procurement, then execute a quantum circuit above</p>
        </div>
      )}
    </div>
  );
}
