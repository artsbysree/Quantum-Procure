"""
QAOA (Quantum Approximate Optimization Algorithm) implementation for procurement optimization.
Uses real Qiskit circuits with Aer simulator.
"""

import time
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from scipy.optimize import minimize


def build_qaoa_circuit(n_qubits: int, costs: list, risks: list, p: int = 2) -> QuantumCircuit:
    """
    Build a QAOA circuit for supplier selection optimization.
    Each qubit represents one supplier: |1> = selected, |0> = not selected.
    
    Args:
        n_qubits: Number of suppliers (qubits)
        costs: Normalized cost for each supplier
        risks: Risk score for each supplier
        p: QAOA depth (number of layers, p >= 2)
    
    Returns:
        Parameterized QuantumCircuit
    """
    qc = QuantumCircuit(n_qubits, n_qubits)
    
    # Encode parameters as circuit params using symbolic names
    gammas = [f'gamma_{i}' for i in range(p)]
    betas = [f'beta_{i}' for i in range(p)]
    
    # Initial state: uniform superposition via Hadamard gates
    qc.h(range(n_qubits))
    qc.barrier()
    
    # QAOA layers
    for layer in range(p):
        gamma_val = np.pi / (4 * (layer + 1))
        beta_val = np.pi / (2 * (layer + 1))
        
        # Problem unitary (encode cost + risk Hamiltonian)
        for i in range(n_qubits):
            objective_weight = costs[i] + 0.3 * risks[i]
            qc.rz(2 * gamma_val * objective_weight, i)
        
        # Entanglement: ZZ interactions between adjacent qubits
        for i in range(n_qubits - 1):
            qc.cx(i, i + 1)
            qc.rz(2 * gamma_val * 0.1, i + 1)
            qc.cx(i, i + 1)
        
        # Wrap-around entanglement for better connectivity
        if n_qubits > 2:
            qc.cx(n_qubits - 1, 0)
            qc.rz(2 * gamma_val * 0.1, 0)
            qc.cx(n_qubits - 1, 0)
        
        qc.barrier()
        
        # Mixer unitary (X rotations)
        for i in range(n_qubits):
            qc.rx(2 * beta_val, i)
        
        qc.barrier()
    
    # Measurement
    qc.measure(range(n_qubits), range(n_qubits))
    
    return qc


def run_qaoa_optimization(suppliers: list, budget: float, shots: int = 1024) -> dict:
    """
    Run QAOA optimization for supplier selection.
    
    Args:
        suppliers: List of supplier dicts with cost, riskScore, deliveryTime
        budget: Maximum budget constraint
        shots: Number of measurement shots
    
    Returns:
        Full optimization result including circuit metrics, probabilities, convergence
    """
    start_time = time.time()
    
    n = len(suppliers)
    if n == 0:
        raise ValueError("No suppliers provided")
    
    # Normalize costs and risks
    max_cost = max(s['cost'] for s in suppliers) or 1
    max_risk = max(s['riskScore'] for s in suppliers) or 1
    
    costs = [s['cost'] / max_cost for s in suppliers]
    risks = [s['riskScore'] / max_risk for s in suppliers]
    
    p = min(2, max(2, n // 2))
    
    # Build and transpile the QAOA circuit
    backend = AerSimulator()
    qc = build_qaoa_circuit(n, costs, risks, p=p)
    
    transpiled = transpile(qc, backend, optimization_level=2)
    circuit_depth = transpiled.depth()
    
    # Convergence tracking via COBYLA optimization
    convergence_data = []
    call_count = [0]
    
    def objective(params):
        """Cost function for COBYLA optimizer."""
        call_count[0] += 1
        
        # Build parameterized circuit with current params
        qc_eval = QuantumCircuit(n, n)
        gammas = params[:p]
        betas = params[p:]
        
        qc_eval.h(range(n))
        
        for layer in range(p):
            gamma = gammas[layer]
            beta = betas[layer]
            
            for i in range(n):
                objective_weight = costs[i] + 0.3 * risks[i]
                qc_eval.rz(2 * gamma * objective_weight, i)
            
            for i in range(n - 1):
                qc_eval.cx(i, i + 1)
                qc_eval.rz(2 * gamma * 0.1, i + 1)
                qc_eval.cx(i, i + 1)
            
            if n > 2:
                qc_eval.cx(n - 1, 0)
                qc_eval.rz(2 * gamma * 0.1, 0)
                qc_eval.cx(n - 1, 0)
            
            for i in range(n):
                qc_eval.rx(2 * beta, i)
        
        qc_eval.measure(range(n), range(n))
        
        # Execute with reduced shots for optimization speed
        t_eval = transpile(qc_eval, backend, optimization_level=1)
        job = backend.run(t_eval, shots=256)
        result = job.result()
        counts = result.get_counts()
        
        # Compute expected cost from counts
        total_cost = 0.0
        total_shots = sum(counts.values())
        for bitstring, count in counts.items():
            prob = count / total_shots
            selected = [i for i, bit in enumerate(reversed(bitstring)) if bit == '1']
            if selected:
                total_c = sum(suppliers[i]['cost'] for i in selected if i < n)
                total_r = sum(suppliers[i]['riskScore'] for i in selected if i < n)
                if total_c <= budget:
                    score = total_c + 0.3 * total_r * max_cost
                else:
                    score = 1e6  # Penalty for budget violation
                total_cost += prob * score
            else:
                total_cost += prob * 1e5  # Penalty for selecting nothing
        
        convergence_data.append({
            'iteration': call_count[0],
            'cost': round(total_cost, 2)
        })
        
        return total_cost
    
    # Initial parameters for COBYLA
    x0 = np.random.uniform(0, np.pi, 2 * p)
    
    # Run COBYLA optimization
    opt_result = minimize(
        objective,
        x0,
        method='COBYLA',
        options={'maxiter': 50, 'rhobeg': 0.5}
    )
    
    # Final circuit execution with optimized parameters
    best_params = opt_result.x
    gammas_opt = best_params[:p]
    betas_opt = best_params[p:]
    
    final_qc = QuantumCircuit(n, n)
    final_qc.h(range(n))
    
    for layer in range(p):
        gamma = gammas_opt[layer]
        beta = betas_opt[layer]
        
        for i in range(n):
            objective_weight = costs[i] + 0.3 * risks[i]
            final_qc.rz(2 * gamma * objective_weight, i)
        
        for i in range(n - 1):
            final_qc.cx(i, i + 1)
            final_qc.rz(2 * gamma * 0.1, i + 1)
            final_qc.cx(i, i + 1)
        
        if n > 2:
            final_qc.cx(n - 1, 0)
            final_qc.rz(2 * gamma * 0.1, 0)
            final_qc.cx(n - 1, 0)
        
        for i in range(n):
            final_qc.rx(2 * beta, i)
    
    final_qc.measure(range(n), range(n))
    
    t_final = transpile(final_qc, backend, optimization_level=2)
    final_job = backend.run(t_final, shots=shots)
    final_result = final_job.result()
    counts = final_result.get_counts()
    
    total_shots_final = sum(counts.values())
    
    # Sort by probability and get top bitstrings
    probs = [
        {'bitstring': bs, 'probability': round(cnt / total_shots_final, 4)}
        for bs, cnt in sorted(counts.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Find best valid solution
    best_solution = None
    best_cost = float('inf')
    
    for bs, cnt in sorted(counts.items(), key=lambda x: x[1], reverse=True):
        selected = [i for i, bit in enumerate(reversed(bs)) if bit == '1']
        if not selected:
            continue
        valid_selected = [i for i in selected if i < n]
        total_c = sum(suppliers[i]['cost'] for i in valid_selected)
        if total_c <= budget and total_c < best_cost:
            best_cost = total_c
            best_solution = bs
            best_selected = valid_selected
    
    if best_solution is None:
        # Fallback: take the highest probability bitstring with at least one qubit
        for bs, cnt in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            selected = [i for i, bit in enumerate(reversed(bs)) if bit == '1']
            valid_selected = [i for i in selected if i < n]
            if valid_selected:
                best_solution = bs
                best_cost = sum(suppliers[i]['cost'] for i in valid_selected)
                best_selected = valid_selected
                break
    
    if best_solution is None:
        best_solution = '0' * n
        best_selected = []
        best_cost = 0
    
    # Classical greedy baseline
    sorted_by_cost = sorted(enumerate(suppliers), key=lambda x: x[1]['cost'])
    classical_cost = 0
    classical_selected = []
    for i, s in sorted_by_cost:
        if classical_cost + s['cost'] <= budget:
            classical_cost += s['cost']
            classical_selected.append(i)
    
    improvement_pct = 0
    if classical_cost > 0 and best_cost > 0:
        improvement_pct = round((classical_cost - best_cost) / classical_cost * 100, 1)
    
    # Statevector amplitudes (compute using statevector simulator)
    sv_qc = QuantumCircuit(n)
    sv_qc.h(range(n))
    for layer in range(p):
        gamma = gammas_opt[layer]
        for i in range(n):
            sv_qc.rz(2 * gamma * (costs[i] + 0.3 * risks[i]), i)
        for i in range(n - 1):
            sv_qc.cx(i, i + 1)
            sv_qc.rz(2 * gamma * 0.1, i + 1)
            sv_qc.cx(i, i + 1)
        for i in range(n):
            sv_qc.rx(2 * gammas_opt[layer] * betas_opt[layer], i)
    
    sv_backend = AerSimulator(method='statevector')
    sv_qc.save_statevector()
    sv_t = transpile(sv_qc, sv_backend)
    sv_result = sv_backend.run(sv_t).result()
    statevector = sv_result.get_statevector()
    amplitudes = [round(float(abs(a) ** 2), 6) for a in statevector]
    
    execution_time = time.time() - start_time
    
    # Circuit diagram (text)
    circuit_diagram = str(qc.draw(output='text', fold=-1))
    
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
    
    return {
        'algorithmUsed': 'QAOA',
        'algorithmReason': 'Medium complexity optimization — QAOA selected for balanced cost/risk procurement scheduling',
        'bestSolution': best_solution,
        'selectedSuppliers': selected_suppliers_data,
        'totalCost': round(best_cost, 2),
        'classicalCost': round(classical_cost, 2),
        'improvement': f'{improvement_pct}%',
        'confidence': round(min(0.99, max(0.5, 1.0 - opt_result.fun / (max_cost * n))), 3),
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
