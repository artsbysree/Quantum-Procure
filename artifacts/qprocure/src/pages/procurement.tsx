import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSuppliers,
  useCreateSupplier,
  useDeleteSupplier,
  useRunQuantumOptimization,
  getGetSuppliersQueryKey,
} from "@workspace/api-client-react";
import { useQuantum } from "@/lib/quantum-context";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Atom,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Shield,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";

const QUANTUM_STEPS = [
  "Selecting optimal quantum algorithm...",
  "Initializing qubits in superposition state |+>...",
  "Applying Hadamard gates across all qubits...",
  "Entangling supplier qubits via CNOT gates...",
  "Encoding cost Hamiltonian via RZ rotations...",
  "Running COBYLA optimization loop...",
  "Measuring quantum state amplitudes...",
  "Collapsing wavefunction to optimal solution...",
  "Extracting procurement solution...",
];

export default function Procurement() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { setLastResult } = useQuantum();
  const { data: suppliers = [], isLoading } = useGetSuppliers();
  const createMutation = useCreateSupplier();
  const deleteMutation = useDeleteSupplier();
  const optimizeMutation = useRunQuantumOptimization();

  const [form, setForm] = useState({ name: "", cost: "", riskScore: "", deliveryTime: "" });
  const [budget, setBudget] = useState("100000");
  const [stepIdx, setStepIdx] = useState(-1);
  const [result, setResult] = useState<null | {
    algorithmUsed: string;
    algorithmReason: string;
    bestSolution: string;
    selectedSuppliers: Array<{ id: number; name: string; cost: number; riskScore: number; deliveryTime: number }>;
    totalCost: number;
    classicalCost: number;
    improvement: string;
    confidence: number;
    probabilities: Array<{ bitstring: string; probability: number }>;
    convergence: Array<{ iteration: number; cost: number }>;
    quantumMetrics: { qubits: number; depth: number; shots: number; backend: string; executionTime: string };
    codeSnippet: string;
    circuitDiagram: string;
    statevectorAmplitudes: number[];
  }>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          name: form.name,
          cost: parseFloat(form.cost),
          riskScore: parseFloat(form.riskScore),
          deliveryTime: parseFloat(form.deliveryTime),
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetSuppliersQueryKey() });
          setForm({ name: "", cost: "", riskScore: "", deliveryTime: "" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetSuppliersQueryKey() }),
    });
  };

  const runQuantum = async () => {
    if (suppliers.length === 0) return;
    setStepIdx(0);

    const stepInterval = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= QUANTUM_STEPS.length - 2) {
          clearInterval(stepInterval);
          return QUANTUM_STEPS.length - 1;
        }
        return prev + 1;
      });
    }, 600);

    try {
      const res = await new Promise<typeof result>((resolve, reject) => {
        optimizeMutation.mutate(
          {
            data: {
              supplierIds: suppliers.map((s) => s.id),
              budget: parseFloat(budget),
            },
          },
          {
            onSuccess: (data) => resolve(data as typeof result),
            onError: reject,
          }
        );
      });
      clearInterval(stepInterval);
      setStepIdx(-1);
      setResult(res);
      if (res) setLastResult(res);
    } catch {
      clearInterval(stepInterval);
      setStepIdx(-1);
    }
  };

  const isRunning = stepIdx >= 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Procurement</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage suppliers and run quantum optimization</p>
        </div>
        <button
          onClick={runQuantum}
          disabled={isRunning || suppliers.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 quantum-glow"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Atom className="w-4 h-4" />
          )}
          Run Quantum Optimization
        </button>
      </div>

      {/* Budget input */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
        <DollarSign className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Budget Constraint:</span>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground w-40 focus:outline-none focus:border-primary/50"
        />
        <span className="text-xs text-muted-foreground">Maximum procurement budget ($)</span>
      </div>

      {/* Quantum Animation */}
      {isRunning && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 quantum-glow">
          <div className="flex items-center gap-3 mb-4">
            <Atom className="w-5 h-5 text-primary animate-spin" />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-widest">Quantum Computation Active</h3>
          </div>
          <div className="space-y-2">
            {QUANTUM_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs transition-all duration-500 ${
                  i === stepIdx
                    ? "text-primary font-medium"
                    : i < stepIdx
                    ? "text-muted-foreground line-through"
                    : "text-muted-foreground/40"
                }`}
              >
                {i < stepIdx ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : i === stepIdx ? (
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse shrink-0" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-muted-foreground/20 shrink-0" />
                )}
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isRunning && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">Quantum Optimization Complete</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Algorithm Used</p>
              <p className="text-sm font-bold text-primary">{result.algorithmUsed}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Quantum Cost</p>
              <p className="text-sm font-bold text-emerald-400">${result.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Classical Cost</p>
              <p className="text-sm font-bold text-muted-foreground">${result.classicalCost.toLocaleString()}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Improvement</p>
              <p className="text-sm font-bold text-orange-400">{result.improvement}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2 italic">{result.algorithmReason}</p>
          <p className="text-xs text-muted-foreground mb-3">
            Selected Suppliers:{" "}
            <span className="text-foreground font-medium">
              {result.selectedSuppliers.map((s) => s.name).join(", ") || "None"}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Best bitstring:</p>
            <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{result.bestSolution}</code>
            <p className="text-xs text-muted-foreground">Confidence: <span className="text-primary">{(result.confidence * 100).toFixed(1)}%</span></p>
          </div>
          <button
            onClick={() => navigate("/quantum-lab")}
            className="mt-4 text-xs text-primary hover:text-primary/80 underline"
          >
            View full quantum analysis in Quantum Lab →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Supplier Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add Supplier
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {[
              { label: "Supplier Name", key: "name", type: "text", placeholder: "e.g. QuantumTech Corp" },
              { label: "Cost ($)", key: "cost", type: "number", placeholder: "e.g. 25000" },
              { label: "Risk Score (0-1)", key: "riskScore", type: "number", placeholder: "e.g. 0.15" },
              { label: "Delivery Time (days)", key: "deliveryTime", type: "number", placeholder: "e.g. 14" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  step={key === "riskScore" ? "0.01" : "1"}
                  min={key === "riskScore" ? "0" : "0"}
                  max={key === "riskScore" ? "1" : undefined}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {createMutation.isPending ? "Adding..." : "Add Supplier"}
            </button>
          </form>
        </div>

        {/* Supplier Table */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            Supplier Network ({suppliers.length} active)
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-muted/30 rounded-lg" />
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No suppliers yet. Add your first supplier to begin quantum optimization.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-auto max-h-96">
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        {s.cost.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        Risk: {(s.riskScore * 100).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {s.deliveryTime}d
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        s.riskScore < 0.2
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : s.riskScore < 0.35
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {s.riskScore < 0.2 ? "Low Risk" : s.riskScore < 0.35 ? "Med Risk" : "High Risk"}
                    </span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
