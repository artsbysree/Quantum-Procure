"""
Generates the actual Qiskit code snippet shown in the Code Viewer page.
"""


def generate_qaoa_code(n_qubits: int, p: int, shots: int) -> str:
    return f'''from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from scipy.optimize import minimize
import numpy as np

# ── Circuit Configuration ──────────────────────────────
n_qubits = {n_qubits}  # Each qubit represents one supplier
p = {p}                 # QAOA circuit depth (layers)
shots = {shots}         # Number of measurement shots

# ── Initialize Quantum Backend ─────────────────────────
backend = AerSimulator()

# ── Build QAOA Circuit ─────────────────────────────────
qc = QuantumCircuit(n_qubits, n_qubits)

# Step 1: Apply Hadamard gates → uniform superposition
qc.h(range(n_qubits))
qc.barrier()

# Step 2: QAOA Layers (Problem + Mixer unitaries)
for layer in range(p):
    gamma = np.pi / (4 * (layer + 1))
    beta  = np.pi / (2 * (layer + 1))
    
    # Problem unitary: encode cost + risk Hamiltonian
    for i in range(n_qubits):
        cost_weight = costs[i] + 0.3 * risks[i]
        qc.rz(2 * gamma * cost_weight, i)
    
    # ZZ entanglement between adjacent qubits
    for i in range(n_qubits - 1):
        qc.cx(i, i + 1)
        qc.rz(2 * gamma * 0.1, i + 1)
        qc.cx(i, i + 1)
    
    # Wrap-around entanglement for full connectivity
    qc.cx(n_qubits - 1, 0)
    qc.rz(2 * gamma * 0.1, 0)
    qc.cx(n_qubits - 1, 0)
    
    qc.barrier()
    
    # Mixer unitary: X rotations
    for i in range(n_qubits):
        qc.rx(2 * beta, i)

# Step 3: Measurement
qc.measure(range(n_qubits), range(n_qubits))

# ── COBYLA Hybrid Optimization ─────────────────────────
def cost_function(params):
    """Variational cost function minimized by COBYLA."""
    qc_eval = build_parameterized_circuit(params)
    transpiled = transpile(qc_eval, backend, optimization_level=1)
    job = backend.run(transpiled, shots=256)
    counts = job.result().get_counts()
    return compute_expected_cost(counts)

x0 = np.random.uniform(0, np.pi, 2 * p)
result = minimize(cost_function, x0, method='COBYLA',
                  options={{'maxiter': 50, 'rhobeg': 0.5}})

# ── Final Execution with Optimized Parameters ──────────
qc_final = build_final_circuit(result.x)
transpiled_final = transpile(qc_final, backend, optimization_level=2)
job_final = backend.run(transpiled_final, shots={shots})
measurement_result = job_final.result()

# ── Extract Results ────────────────────────────────────
counts = measurement_result.get_counts()
best_bitstring = max(counts, key=counts.get)
# Decode: bit[i]=1 → supplier i is selected
selected = [i for i, b in enumerate(reversed(best_bitstring)) if b == '1']

print(f"Algorithm: QAOA (p={p})")
print(f"Best solution: {{best_bitstring}}")
print(f"Selected suppliers: {{selected}}")
print(f"Measurement counts: {{counts}}")
'''


def generate_vqe_code(n_qubits: int, shots: int) -> str:
    return f'''from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from scipy.optimize import minimize
import numpy as np

# ── VQE Configuration ──────────────────────────────────
n_qubits = {n_qubits}  # Number of suppliers/qubits
shots = {shots}

backend = AerSimulator()

# ── Hardware-Efficient Ansatz ──────────────────────────
def build_ansatz(params):
    qc = QuantumCircuit(n_qubits, n_qubits)
    
    # Initial superposition
    qc.h(range(n_qubits))
    
    # Layer 1: Single-qubit RY rotations
    for i in range(n_qubits):
        qc.ry(params[i], i)
    
    # CNOT entanglement chain
    for i in range(n_qubits - 1):
        qc.cx(i, i + 1)
    
    # Layer 2: RY + RZ rotations
    for i in range(n_qubits):
        qc.ry(params[n_qubits + i], i)
        qc.rz(params[n_qubits + i] * 0.5, i)
    
    qc.measure(range(n_qubits), range(n_qubits))
    return qc

# ── Variational Cost Function ──────────────────────────
def vqe_objective(params):
    qc = build_ansatz(params)
    transpiled = transpile(qc, backend, optimization_level=1)
    job = backend.run(transpiled, shots=256)
    counts = job.result().get_counts()
    return compute_cost_hamiltonian(counts)

# ── COBYLA Optimizer ───────────────────────────────────
x0 = np.random.uniform(0, np.pi, 2 * n_qubits)
opt_result = minimize(vqe_objective, x0, method='COBYLA',
                      options={{'maxiter': 40, 'rhobeg': 0.5}})

# ── Execute Final Circuit ──────────────────────────────
final_qc = build_ansatz(opt_result.x)
transpiled = transpile(final_qc, backend, optimization_level=2)
job = backend.run(transpiled, shots={shots})
counts = job.result().get_counts()

best = max(counts, key=counts.get)
selected = [i for i, b in enumerate(reversed(best)) if b == '1']
print(f"VQE optimal solution: {{best}} → suppliers {{selected}}")
'''


def generate_grover_code(n_qubits: int, target: list, shots: int) -> str:
    target_str = str(target)
    return f'''from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np

# ── Grover's Search Configuration ─────────────────────
n_qubits = {n_qubits}     # Search space: 2^n combinations
target_suppliers = {target_str}  # Oracle target (optimal combination)
shots = {shots}

N = 2 ** n_qubits
iterations = max(1, int(np.pi / 4 * np.sqrt(N)))
backend = AerSimulator()

# ── Build Grover Circuit ───────────────────────────────
qc = QuantumCircuit(n_qubits, n_qubits)

# Step 1: Uniform superposition
qc.h(range(n_qubits))
qc.barrier()

for _ in range(iterations):
    # ── Oracle: Mark the target state ─────────────
    target_bitstring = ['0'] * n_qubits
    for idx in target_suppliers:
        target_bitstring[idx] = '1'
    
    # Flip zero-bits to apply controlled-Z
    for i, bit in enumerate(target_bitstring):
        if bit == '0':
            qc.x(i)
    
    # Multi-controlled Z gate (phase kickback)
    qc.h(n_qubits - 1)
    qc.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    qc.h(n_qubits - 1)
    
    # Restore flipped qubits
    for i, bit in enumerate(target_bitstring):
        if bit == '0':
            qc.x(i)
    
    qc.barrier()
    
    # ── Diffusion Operator (Amplitude Amplification) ──
    qc.h(range(n_qubits))
    qc.x(range(n_qubits))
    qc.h(n_qubits - 1)
    qc.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    qc.h(n_qubits - 1)
    qc.x(range(n_qubits))
    qc.h(range(n_qubits))
    qc.barrier()

# ── Measure All Qubits ─────────────────────────────────
qc.measure(range(n_qubits), range(n_qubits))

# ── Execute on Aer Simulator ───────────────────────────
transpiled = transpile(qc, backend, optimization_level=2)
job = backend.run(transpiled, shots={shots})
result = job.result()
counts = result.get_counts()

# Grover amplifies the target state probability ≈ 1 - 1/N
best = max(counts, key=counts.get)
selected = [i for i, b in enumerate(reversed(best)) if b == '1']
print(f"Grover search result: {{best}}")
print(f"Optimal suppliers found: {{selected}}")
print(f"Measurement counts: {{dict(sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5])}}")
'''


def get_code_snippet(algorithm: str, n_qubits: int, shots: int = 1024, **kwargs) -> str:
    algorithm_lower = algorithm.lower()
    if 'qaoa' in algorithm_lower:
        return generate_qaoa_code(n_qubits, p=2, shots=shots)
    elif 'vqe' in algorithm_lower:
        return generate_vqe_code(n_qubits, shots=shots)
    elif 'grover' in algorithm_lower:
        target = kwargs.get('target', list(range(min(2, n_qubits))))
        return generate_grover_code(n_qubits, target, shots=shots)
    else:
        return generate_qaoa_code(n_qubits, p=2, shots=shots)
