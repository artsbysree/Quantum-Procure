import { useQuantum } from "@/lib/quantum-context";
import { Code2, Copy, CheckCheck, Atom, Terminal } from "lucide-react";
import { useState } from "react";

function CodeBlock({ code, language = "python" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightLine = (line: string) => {
    if (line.trimStart().startsWith("#")) {
      return <span className="text-emerald-400/70 italic">{line}</span>;
    }
    if (line.includes("def ") || line.includes("class ")) {
      return <span className="text-accent">{line}</span>;
    }
    if (
      line.includes("QuantumCircuit(") ||
      line.includes("transpile(") ||
      line.includes("backend.run(") ||
      line.includes("AerSimulator(")
    ) {
      return <span className="text-primary">{line}</span>;
    }
    if (
      line.includes(".h(") ||
      line.includes(".rz(") ||
      line.includes(".rx(") ||
      line.includes(".cx(") ||
      line.includes(".measure(") ||
      line.includes(".ry(") ||
      line.includes(".cp(") ||
      line.includes(".mcx(")
    ) {
      return <span className="text-orange-400">{line}</span>;
    }
    if (line.includes("from ") || line.includes("import ")) {
      return <span className="text-blue-400">{line}</span>;
    }
    if (line.includes("print(")) {
      return <span className="text-yellow-300/90">{line}</span>;
    }
    return <span className="text-foreground/90">{line}</span>;
  };

  return (
    <div className="relative rounded-xl border border-border bg-black/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">{language}</span>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted/30 hover:bg-muted/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-auto p-6 max-h-[70vh]">
        <pre className="text-xs font-mono leading-relaxed">
          {code.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-muted-foreground/30 w-8 shrink-0 text-right mr-4">
                {i + 1}
              </span>
              <span>{highlightLine(line)}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default function QuantumCodeViewer() {
  const { lastResult } = useQuantum();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Code2 className="w-6 h-6 text-accent" />
            Quantum Code Viewer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Actual Qiskit source code used in the last quantum computation
          </p>
        </div>
        {lastResult && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
            <Atom className="w-4 h-4 text-accent" />
            <span className="text-xs text-accent font-medium">{lastResult.algorithmUsed}</span>
          </div>
        )}
      </div>

      {lastResult ? (
        <div className="space-y-6">
          {/* Algorithm info */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {[
              { label: "Algorithm", value: lastResult.algorithmUsed },
              { label: "Qubits", value: `${lastResult.quantumMetrics.qubits}` },
              { label: "Circuit Depth", value: `${lastResult.quantumMetrics.depth}` },
              { label: "Backend", value: lastResult.quantumMetrics.backend },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-mono font-medium text-primary">{value}</p>
              </div>
            ))}
          </div>

          {/* Main Code */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Qiskit Source Code</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
            <CodeBlock code={lastResult.codeSnippet} language="python" />
          </div>

          {/* Circuit Diagram */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Atom className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Circuit Diagram (ASCII)</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="rounded-xl border border-accent/20 bg-black/60 p-6 overflow-auto">
              <pre className="text-xs font-mono text-accent/80 leading-relaxed whitespace-pre">
                {lastResult.circuitDiagram}
              </pre>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-primary/80 text-center">
              This code was executed in real-time using Qiskit {lastResult.quantumMetrics.backend}.
              No results were hardcoded — all outputs are from actual quantum circuit measurement ({lastResult.quantumMetrics.shots} shots).
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-xl space-y-4">
          <Code2 className="w-12 h-12 mx-auto text-muted-foreground opacity-30" />
          <div>
            <p className="text-sm text-muted-foreground mb-2">No quantum code to display yet</p>
            <p className="text-xs text-muted-foreground/60">
              Run a quantum optimization in the Quantum Lab or Procurement page first.
              The actual Qiskit source code will appear here automatically.
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-black/60 p-6 text-left max-w-2xl mx-auto">
            <pre className="text-xs font-mono text-muted-foreground/50 leading-relaxed">
{`# Waiting for quantum execution...
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# A quantum circuit will appear here after
# you run optimization in the Quantum Lab.
# |ψ⟩ = α|0⟩ + β|1⟩

circuit = QuantumCircuit(n, n)
circuit.h(range(n))  # |+⟩ superposition
# ...execution pending...`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
