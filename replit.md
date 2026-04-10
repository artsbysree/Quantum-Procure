# QProcure — Quantum Decision Intelligence Platform

## Overview
Full-stack enterprise procurement platform powered by real quantum computing (Qiskit Aer Simulator). Features supplier optimization, inventory management, sales analytics, and a Quantum Lab with live circuit visualization.

## Architecture

### Services
- **Frontend** (`artifacts/qprocure`): React + Vite + Tailwind dark/neon UI — port from `$PORT`
- **API Server** (`artifacts/api-server`): Node.js/Express REST API — port 8080
- **Quantum Service** (`quantum_service`): Python/FastAPI with Qiskit — port 8000
- **Database**: PostgreSQL via `DATABASE_URL`

### Key Technologies
- **Quantum**: Qiskit 2.3.1, Qiskit-Aer, QAOA (COBYLA), VQE, Grover's Search, Amplitude Estimation
- **Frontend**: React, Wouter routing, TanStack Query, Recharts, Lucide icons, Tailwind CSS
- **Backend**: Express.js, Drizzle ORM, Zod validation, Pino logging
- **Database**: PostgreSQL with suppliers, inventory, sales tables

## Pages
1. **Dashboard** (`/`) — KPI cards, sales trend, inventory valuation, cost comparison charts
2. **Procurement** (`/procurement`) — Supplier CRUD, quantum optimization runner with animated steps
3. **Inventory** (`/inventory`) — Product CRUD, low stock alerts, value tracking
4. **Sales** (`/sales`) — Transaction recording, revenue chart
5. **Quantum Lab** (`/quantum-lab`) — Full quantum analysis: circuit diagram, probability histogram, convergence, statevector amplitudes, quantum vs classical comparison
6. **Code Viewer** (`/quantum-code`) — Actual Qiskit source code used in last computation

## Quantum Algorithms
- **QAOA** (p≥2, COBYLA): Used for 4-8 suppliers, handles budget constraints
- **VQE** (hardware-efficient ansatz): Used for 9+ suppliers, variational optimization
- **Grover's Search**: Used for ≤3 suppliers, quadratic speedup O(√N)
- **Amplitude Estimation**: Used for single-supplier scenarios

## Critical Notes
- `QUANTUM_SERVICE_URL` defaults to `http://localhost:8000` (fixed from 8001)
- `QuantumProvider` context wraps the entire app to share quantum results across pages
- All quantum results are real — no hardcoded data, uses actual `backend.run()` + `result.get_counts()`
- Seeded data: 7 suppliers, 6 inventory items, 8 sales records

## File Structure
```
artifacts/
  qprocure/src/
    App.tsx                    — Router + QuantumProvider
    lib/quantum-context.tsx    — Shared quantum state
    components/Layout.tsx      — Sidebar navigation
    pages/
      dashboard.tsx
      procurement.tsx
      inventory.tsx
      sales.tsx
      quantum-lab.tsx
      quantum-code.tsx
  api-server/src/routes/
    suppliers.ts
    inventory.ts
    sales.ts
    quantum.ts                 — Proxies to Python service
    dashboard.ts
quantum_service/
  main.py                      — FastAPI entry point
  quantum/
    qaoa.py                    — QAOA implementation
    vqe.py                     — VQE implementation
    grover.py                  — Grover's Search
    strategy.py                — Algorithm selector
lib/
  api-client-react/            — Generated hooks + custom fetch
  api-zod/                     — Zod schemas from OpenAPI
  db/                          — Drizzle ORM schema
```
