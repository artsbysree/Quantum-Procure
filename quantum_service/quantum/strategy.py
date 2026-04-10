"""
Quantum Strategy Engine: Selects the optimal quantum algorithm based on problem complexity.

| Condition           | Algorithm            |
| ------------------- | -------------------- |
| Small dataset       | Grover's Search      |
| Medium              | QAOA                 |
| Complex constraints | VQE                  |
| Confidence needed   | Amplitude Estimation |
"""

from typing import Optional


def select_algorithm(
    n_suppliers: int,
    budget: float,
    total_cost: float,
    max_risk: float,
    preferred_algorithm: Optional[str] = None
) -> tuple[str, str]:
    """
    Select the optimal quantum algorithm based on problem characteristics.
    
    Returns:
        (algorithm_name, reason)
    """
    if preferred_algorithm and preferred_algorithm.lower() in ['qaoa', 'vqe', 'grover', 'amplitude']:
        algo_map = {
            'qaoa': ('QAOA', 'User-selected QAOA algorithm for procurement optimization'),
            'vqe': ('VQE', 'User-selected VQE for cost minimization'),
            'grover': ('grover', "User-selected Grover's algorithm for optimal search"),
            'amplitude': ('amplitude', 'User-selected Quantum Amplitude Estimation for confidence analysis'),
        }
        key = preferred_algorithm.lower()
        return algo_map[key]
    
    if n_suppliers <= 3:
        return (
            'grover',
            "Small dataset (≤3 suppliers) — Grover's algorithm provides quadratic speedup O(√N) for optimal combination search"
        )
    elif n_suppliers <= 8:
        budget_ratio = budget / total_cost if total_cost > 0 else 1.0
        if budget_ratio < 0.6 or max_risk > 0.3:
            return (
                'VQE',
                f'Complex constraints detected (budget ratio: {budget_ratio:.2f}, max risk: {max_risk:.2f}) — VQE selected for variational cost minimization'
            )
        else:
            return (
                'QAOA',
                f'Medium complexity (n={n_suppliers} suppliers) — QAOA selected for balanced quantum approximate optimization with p=2 layers'
            )
    else:
        return (
            'VQE',
            f'Large-scale problem (n={n_suppliers} suppliers) — VQE with hardware-efficient ansatz handles high-dimensional Hilbert space'
        )
