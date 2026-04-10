import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, inventoryTable } from "@workspace/db";
import {
  CreateInventoryItemBody,
  UpdateInventoryItemParams,
  UpdateInventoryItemBody,
  DeleteInventoryItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory", async (_req, res): Promise<void> => {
  const items = await db.select().from(inventoryTable).orderBy(inventoryTable.createdAt);
  res.json(items);
});

router.post("/inventory", async (req, res): Promise<void> => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(inventoryTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.put("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db
    .update(inventoryTable)
    .set(parsed.data)
    .where(eq(inventoryTable.id, params.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  res.json(item);
});

router.delete("/inventory/:id", async (req, res): Promise<void> => {
  const params = DeleteInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.delete(inventoryTable).where(eq(inventoryTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
