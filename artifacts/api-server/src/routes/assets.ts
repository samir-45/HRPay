import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, employeesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getRequestUser, requireCompanyUser, requireNonEmployee } from "../lib/auth-helpers";

const router = Router();

function mapAsset(a: { purchaseCost?: string | null; employeeFirstName?: string | null; employeeLastName?: string | null; [key: string]: unknown }) {
  return {
    ...a,
    purchaseCost: a.purchaseCost ? Number(a.purchaseCost) : null,
    assignedToName:
      a.employeeFirstName && a.employeeLastName
        ? `${a.employeeFirstName} ${a.employeeLastName}`
        : null,
  };
}

router.get("/assets", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;

  /* Use companyId column directly — avoids the LEFT JOIN bug where unassigned
     assets (no employee) would be excluded by the employee companyId filter */
  const assets = await db
    .select({
      id: assetsTable.id,
      companyId: assetsTable.companyId,
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
    .where(cid ? eq(assetsTable.companyId, cid) : undefined)
    .orderBy(desc(assetsTable.createdAt));

  res.json(assets.map(mapAsset));
});

router.get("/assets/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }

  const cid = user.companyId;
  const id = Number(req.params.id);

  const conditions = [eq(assetsTable.id, id)];
  if (cid) conditions.push(eq(assetsTable.companyId, cid));

  const [asset] = await db.select().from(assetsTable).where(and(...conditions));
  if (!asset) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...asset, purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null });
});

router.post("/assets", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const {
    name, category, brand, model, serialNumber, purchaseDate,
    purchaseCost, status, location, warrantyExpiry, notes,
  } = req.body as {
    name?: string; category?: string; brand?: string; model?: string;
    serialNumber?: string; purchaseDate?: string; purchaseCost?: number | string;
    status?: string; location?: string; warrantyExpiry?: string; notes?: string;
  };

  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [asset] = await db
    .insert(assetsTable)
    .values({
      companyId: user.companyId,
      name,
      category: category ?? "other",
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost: purchaseCost ? String(purchaseCost) : undefined,
      status: status ?? "available",
      location,
      warrantyExpiry,
      notes,
    })
    .returning();

  res.status(201).json({ ...asset, purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null });
});

router.patch("/assets/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  const [updated] = await db
    .update(assetsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(assetsTable.id, Number(req.params.id)), eq(assetsTable.companyId, user.companyId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, purchaseCost: updated.purchaseCost ? Number(updated.purchaseCost) : null });
});

router.patch("/assets/:id/assign", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

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
    .where(and(eq(assetsTable.id, id), eq(assetsTable.companyId, user.companyId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, purchaseCost: updated.purchaseCost ? Number(updated.purchaseCost) : null });
});

router.delete("/assets/:id", async (req, res) => {
  const user = requireCompanyUser(req, res);
  if (!user) return;

  if (user.role === "employee") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }

  await db
    .delete(assetsTable)
    .where(and(eq(assetsTable.id, Number(req.params.id)), eq(assetsTable.companyId, user.companyId)));
  res.status(204).send();
});

export default router;
