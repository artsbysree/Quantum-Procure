"""
QProcure Quantum Service — FastAPI backend for real Qiskit quantum computation.
Runs on a separate port and is called by the Node.js API server.
"""

import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import qiskit
import qiskit_aer

from quantum.strategy import select_algorithm
from quantum.code_generator import get_code_snippet
from quantum.qaoa import run_qaoa_optimization
from quantum.vqe import run_vqe_optimization
from quantum.grover import run_grover_search
from quantum.amplitude_estimation import run_amplitude_estimation

app = FastAPI(title="QProcure Quantum Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SupplierInput(BaseModel):
    id: int
    name: str
    cost: float
    riskScore: float
    deliveryTime: float


class OptimizeRequest(BaseModel):
    suppliers: list[SupplierInput]
    budget: float
    algorithm: Optional[str] = None
    shots: Optional[int] = 1024


@app.get("/quantum/health")
async def health():
    return {
        "status": "ok",
        "qiskit_version": qiskit.__version__,
        "aer_version": qiskit_aer.__version__,
    }


@app.get("/quantum/status")
async def status():
    return {
        "available": True,
        "backend": "aer_simulator",
        "version": qiskit.__version__,
        "message": f"Qiskit {qiskit.__version__} with Aer simulator ready. Real quantum circuits executing on statevector/shot-based simulation."
    }


@app.post("/quantum/optimize")
async def optimize(req: OptimizeRequest):
    suppliers = [s.model_dump() for s in req.suppliers]
    
    if not suppliers:
        raise HTTPException(status_code=400, detail="No suppliers provided")
    
    n = len(suppliers)
    total_cost = sum(s['cost'] for s in suppliers)
    max_risk = max(s['riskScore'] for s in suppliers) if suppliers else 0
    
    algorithm_key, algorithm_reason = select_algorithm(
        n_suppliers=n,
        budget=req.budget,
        total_cost=total_cost,
        max_risk=max_risk,
        preferred_algorithm=req.algorithm
    )
    
    shots = req.shots or 1024
    
    if algorithm_key == 'grover':
        result = run_grover_search(suppliers, req.budget, shots=shots)
    elif algorithm_key == 'VQE':
        result = run_vqe_optimization(suppliers, req.budget, shots=shots)
    elif algorithm_key == 'amplitude':
        result = run_amplitude_estimation(suppliers, 0.75, shots=shots)
    else:
        result = run_qaoa_optimization(suppliers, req.budget, shots=shots)
    
    result['algorithmReason'] = algorithm_reason
    
    code_snippet = get_code_snippet(
        result['algorithmUsed'],
        n_qubits=n,
        shots=shots,
        target=[s['id'] for s in result.get('selectedSuppliers', suppliers[:2])]
    )
    result['codeSnippet'] = code_snippet
    
    return result
