import { Router, type IRouter } from "express";
import { db, suppliersTable } from "@workspace/db";
import {
  RunQuantumOptimizationBody,
} from "@workspace/api-zod";

const QUANTUM_SERVICE_URL = process.env.QUANTUM_SERVICE_URL || "http://localhost:8000";

const router: IRouter = Router();

router.get("/quantum/status", async (req, res): Promise<void> => {
  try {
    const response = await fetch(`${QUANTUM_SERVICE_URL}/quantum/status`);
    if (!response.ok) {
      res.json({
        available: false,
        backend: "unavailable",
        version: "unknown",
        message: "Quantum service is starting up. Please try again shortly."
      });
      return;
    }
    const data = await response.json() as Record<string, unknown>;
    res.json(data);
  } catch {
    res.json({
      available: false,
      backend: "unavailable",
      version: "unknown",
      message: "Quantum service is initializing. Real Qiskit circuits will be available shortly."
    });
  }
});

router.post("/quantum/optimize", async (req, res): Promise<void> => {
  const parsed = RunQuantumOptimizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { supplierIds, budget, algorithm } = parsed.data;

  // Fetch supplier details from DB
  const allSuppliers = await db.select().from(suppliersTable);
  
  let suppliers = allSuppliers;
  if (supplierIds && supplierIds.length > 0) {
    suppliers = allSuppliers.filter(s => supplierIds.includes(s.id));
  }

  if (suppliers.length === 0) {
    res.status(400).json({ error: "No suppliers found for given IDs" });
    return;
  }

  const quantumPayload = {
    suppliers: suppliers.map(s => ({
      id: s.id,
      name: s.name,
      cost: s.cost,
      riskScore: s.riskScore,
      deliveryTime: s.deliveryTime,
    })),
    budget,
    algorithm: algorithm || null,
    shots: 1024,
  };

  try {
    const response = await fetch(`${QUANTUM_SERVICE_URL}/quantum/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quantumPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, body: errText }, "Quantum service error");
      res.status(500).json({ error: "Quantum optimization failed", detail: errText });
      return;
    }

    const result = await response.json() as Record<string, unknown>;
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to reach quantum service");
    res.status(503).json({ error: "Quantum service unavailable", detail: String(err) });
  }
});

export default router;
