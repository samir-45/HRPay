import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, employeesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/assets", async (_req, res) => {
  const assets = await db
    .select({
      id: assetsTable.id,
      name: assetsTable.name,
      category: assetsTable.category,
      brand: assetsTable.brand,
      model: assetsTable.model,
      serialNumber: assetsTable.serialNumber,
      purchaseDate: assetsTable.purchaseDate,
      purchaseCost: assetsTable.purchaseCost,
      status: assetsTable.status,
      assignedTo: assetsTable.assignedTo,
      assignedAt: assetsTable.assignedAt,
      location: assetsTable.location,
      warrantyExpiry: assetsTable.warrantyExpiry,
      notes: assetsTable.notes,
      employeeFirstName: employeesTable.firstName,
      employeeLastName: employeesTable.lastName,
    })
    .from(assetsTable)
    .leftJoin(employeesTable, eq(assetsTable.assignedTo, employeesTable.id))
    .orderBy(desc(assetsTable.createdAt));
  res.json(assets);
});

router.get("/assets/:id", async (req, res) => {
  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, Number(req.params.id)));
  if (!asset) return res.status(404).json({ error: "Not found" });
  res.json(asset);
});

router.post("/assets", async (req, res) => {
  const { name, category, brand, model, serialNumber, purchaseDate, purchaseCost, status, location, warrantyExpiry, notes } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const [asset] = await db.insert(assetsTable).values({
    name, category: category ?? "other", brand, model, serialNumber,
    purchaseDate, purchaseCost: purchaseCost ? String(purchaseCost) : undefined,
    status: status ?? "available", location, warrantyExpiry, notes,
  }).returning();
  res.status(201).json(asset);
});

router.patch("/assets/:id", async (req, res) => {
  const { name, category, brand, model, serialNumber, purchaseDate, purchaseCost, status, assignedTo, location, warrantyExpiry, notes } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (category !== undefined) update.category = category;
  if (brand !== undefined) update.brand = brand;
  if (model !== undefined) update.model = model;
  if (serialNumber !== undefined) update.serialNumber = serialNumber;
  if (purchaseDate !== undefined) update.purchaseDate = purchaseDate;
  if (purchaseCost !== undefined) update.purchaseCost = String(purchaseCost);
  if (status !== undefined) update.status = status;
  if (assignedTo !== undefined) {
    update.assignedTo = assignedTo ? Number(assignedTo) : null;
    update.assignedAt = assignedTo ? new Date() : null;
    if (assignedTo) update.status = "assigned";
    else if (status === "assigned") update.status = "available";
  }
  if (location !== undefined) update.location = location;
  if (warrantyExpiry !== undefined) update.warrantyExpiry = warrantyExpiry;
  if (notes !== undefined) update.notes = notes;

  const [asset] = await db.update(assetsTable).set(update).where(eq(assetsTable.id, Number(req.params.id))).returning();
  res.json(asset);
});

router.delete("/assets/:id", async (req, res) => {
  await db.delete(assetsTable).where(eq(assetsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;
