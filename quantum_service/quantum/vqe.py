"""
VQE (Variational Quantum Eigensolver) implementation for cost minimization.
Compares results with QAOA for complex constraint problems.
"""

import time
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from scipy.optimize import minimize


def build_vqe_circuit(n_qubits: int, params: list) -> QuantumCircuit:
    """
    Build a VQE ansatz (RY rotations + CNOT entanglement).
    Uses a hardware-efficient ansatz suitable for optimization problems.
    """
    qc = QuantumCircuit(n_qubits, n_qubits)
    
    # Initial superposition
    qc.h(range(n_qubits))
    
    # Layer 1: single-qubit rotations
    for i in range(n_qubits):
        qc.ry(params[i], i)
    
    # Entanglement layer: CNOT chain
    for i in range(n_qubits - 1):
        qc.cx(i, i + 1)
    
    # Layer 2: more rotations
    for i in range(n_qubits):
        if n_qubits + i < len(params):
            qc.ry(params[n_qubits + i], i)
            qc.rz(params[n_qubits + i] * 0.5, i)
    
    qc.barrier()
    qc.measure(range(n_qubits), range(n_qubits))
    
    return qc


def run_vqe_optimization(suppliers: list, budget: float, shots: int = 1024) -> dict:
    """
    Run VQE optimization for complex constraint supplier selection.
    Returns full quantum result with circuit metrics.
    """
    start_time = time.time()
    
    n = len(suppliers)
    if n == 0:
        raise ValueError("No suppliers provided")
    
    max_cost = max(s['cost'] for s in suppliers) or 1
    
    backend = AerSimulator()
    convergence_data = []
    call_count = [0]
    
    def objective(params):
        call_count[0] += 1
        qc = build_vqe_circuit(n, params)
        t = transpile(qc, backend, optimization_level=1)
        job = backend.run(t, shots=256)
        result = job.result()
        counts = result.get_counts()
        
        total_cost = 0.0
        total = sum(counts.values())
        for bitstring, cnt in counts.items():
            prob = cnt / total
            selected = [i for i, bit in enumerate(reversed(bitstring)) if bit == '1' and i < n]
            if selected:
                c = sum(suppliers[i]['cost'] for i in selected)
                if c <= budget:
                    total_cost += prob * c
                else:
                    total_cost += prob * 1e6
            else:
                total_cost += prob * 1e5
        
        convergence_data.append({'iteration': call_count[0], 'cost': round(total_cost, 2)})
        return total_cost
    
    n_params = 2 * n
    x0 = np.random.uniform(0, np.pi, n_params)
    
    opt = minimize(objective, x0, method='COBYLA', options={'maxiter': 40, 'rhobeg': 0.5})
    
    # Final execution
    final_qc = build_vqe_circuit(n, opt.x)
    t_final = transpile(final_qc, backend, optimization_level=2)
    final_job = backend.run(t_final, shots=shots)
    final_result = final_job.result()
    counts = final_result.get_counts()
    
    total = sum(counts.values())
    probs = [
        {'bitstring': bs, 'probability': round(cnt / total, 4)}
        for bs, cnt in sorted(counts.items(), key=lambda x: x[1], reverse=True)
    ]
    
    best_solution = None
    best_cost = float('inf')
    best_selected = []
    
    for bs, cnt in sorted(counts.items(), key=lambda x: x[1], reverse=True):
        selected = [i for i, bit in enumerate(reversed(bs)) if bit == '1' and i < n]
        if selected:
            c = sum(suppliers[i]['cost'] for i in selected)
            if c <= budget and c < best_cost:
                best_cost = c
                best_solution = bs
                best_selected = selected
    
    if best_solution is None:
        for bs, cnt in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            selected = [i for i, bit in enumerate(reversed(bs)) if bit == '1' and i < n]
            if selected:
                best_solution = bs
                best_cost = sum(suppliers[i]['cost'] for i in selected)
                best_selected = selected
                break
    
    if best_solution is None:
        best_solution = '0' * n
        best_selected = []
        best_cost = 0
    
    sorted_supp = sorted(enumerate(suppliers), key=lambda x: x[1]['cost'])
    classical_cost = 0
    for i, s in sorted_supp:
        if classical_cost + s['cost'] <= budget:
            classical_cost += s['cost']
    
    improvement_pct = 0
    if classical_cost > 0 and best_cost > 0:
        improvement_pct = round((classical_cost - best_cost) / classical_cost * 100, 1)
    
    execution_time = time.time() - start_time
    
    circuit_diagram = str(final_qc.draw(output='text', fold=-1))
    circuit_depth = t_final.depth()
    
    selected_suppliers_data = [
        {
            'id': suppliers[i]['id'],
            'name': suppliers[i]['name'],
            'cost': suppliers[i]['cost'],
            'riskScore': suppliers[i]['riskScore'],
            'deliveryTime': suppliers[i]['deliveryTime']
        }
        for i in best_selected
    ]
    
    # Statevector
    sv_qc = QuantumCircuit(n)
    sv_qc.h(range(n))
    for i in range(n):
        sv_qc.ry(opt.x[i], i)
    for i in range(n - 1):
        sv_qc.cx(i, i + 1)
    
    sv_backend = AerSimulator(method='statevector')
    sv_qc.save_statevector()
    sv_t = transpile(sv_qc, sv_backend)
    sv_result = sv_backend.run(sv_t).result()
    statevector = sv_result.get_statevector()
    amplitudes = [round(float(abs(a) ** 2), 6) for a in statevector]
    
    return {
        'algorithmUsed': 'VQE',
        'algorithmReason': 'Complex constraints detected — VQE selected for variational cost minimization with hardware-efficient ansatz',
        'bestSolution': best_solution,
        'selectedSuppliers': selected_suppliers_data,
        'totalCost': round(best_cost, 2),
        'classicalCost': round(classical_cost, 2),
        'improvement': f'{improvement_pct}%',
        'confidence': round(min(0.99, max(0.5, 0.85 - opt.fun / (max_cost * n * 10))), 3),
        'probabilities': probs[:20],
        'convergence': convergence_data,
        'quantumMetrics': {
            'qubits': n,
            'depth': circuit_depth,
            'shots': shots,
            'backend': 'aer_simulator',
            'executionTime': f'{execution_time:.2f}s'
        },
        'circuitDiagram': circuit_diagram,
        'statevectorAmplitudes': amplitudes[:64]
    }
