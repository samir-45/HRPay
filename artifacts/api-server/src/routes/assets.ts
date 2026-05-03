import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, employeesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getRequestUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

router.get("/assets", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;

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
    .where(cid ? eq(employeesTable.companyId, cid) : undefined)
    .orderBy(desc(assetsTable.createdAt));

  res.json(
    assets.map((a) => ({
      ...a,
      purchaseCost: a.purchaseCost ? Number(a.purchaseCost) : null,
      assignedToName:
        a.employeeFirstName && a.employeeLastName
          ? `${a.employeeFirstName} ${a.employeeLastName}`
          : null,
    }))
  );
});

router.get("/assets/:id", async (req, res) => {
  const [asset] = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.id, Number(req.params.id)));
  if (!asset) return res.status(404).json({ error: "Not found" });
  res.json({ ...asset, purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null });
});

router.post("/assets", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;

  const { name, category, brand, model, serialNumber, purchaseDate, purchaseCost, status, location, warrantyExpiry, notes } = req.body as {
    name?: string; category?: string; brand?: string; model?: string; serialNumber?: string;
    purchaseDate?: string; purchaseCost?: number | string; status?: string;
    location?: string; warrantyExpiry?: string; notes?: string;
  };

  if (!name) return res.status(400).json({ error: "name is required" });

  const [asset] = await db
    .insert(assetsTable)
    .values({ name, category: category ?? "other", brand, model, serialNumber, purchaseDate, purchaseCost: purchaseCost ? String(purchaseCost) : undefined, status: status ?? "available", location, warrantyExpiry, notes })
    .returning();
  res.status(201).json({ ...asset, purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null });
});

router.patch("/assets/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;

  const [updated] = await db
    .update(assetsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(assetsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ ...updated, purchaseCost: updated.purchaseCost ? Number(updated.purchaseCost) : null });
});

router.patch("/assets/:id/assign", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;

  const { employeeId } = req.body as { employeeId?: number | null };
  const id = Number(req.params.id);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (employeeId != null) {
    updates.assignedTo = Number(employeeId);
    updates.assignedAt = new Date();
    updates.status = "assigned";
  } else {
    updates.assignedTo = null;
    updates.assignedAt = null;
    updates.status = "available";
  }

  const [updated] = await db
    .update(assetsTable)
    .set(updates)
    .where(eq(assetsTable.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ ...updated, purchaseCost: updated.purchaseCost ? Number(updated.purchaseCost) : null });
});

router.delete("/assets/:id", async (req, res) => {
  if (!requireNonEmployee(req, res)) return;
  await db.delete(assetsTable).where(eq(assetsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
