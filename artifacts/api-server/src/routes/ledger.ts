import { Router, type IRouter } from "express";
import { db, ledgerEntriesTable } from "@workspace/db";
import { eq, and, desc, gte } from "drizzle-orm";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.use(authMiddleware);

function periodStart(period?: string): Date | null {
  const now = new Date();
  if (!period || period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === "bimonth") {
    return new Date(now.getFullYear(), Math.max(0, now.getMonth() - 1), 1);
  }
  return null;
}

router.post("/ledger", async (req: AuthRequest, res): Promise<void> => {
  const { type, counterpartyName, amount, dueDate, note } = req.body as {
    type: "payable" | "receivable";
    counterpartyName: string;
    amount: number;
    dueDate?: string;
    note?: string;
  };

  if (!type || !["payable", "receivable"].includes(type) || !counterpartyName || amount == null) {
    res.status(400).json({ message: "type, counterpartyName and amount are required" });
    return;
  }

  const [entry] = await db
    .insert(ledgerEntriesTable)
    .values({
      userId: req.user!.id,
      type,
      counterpartyName,
      amount,
      status: "outstanding",
      dueDate: dueDate ? new Date(dueDate) : null,
      note: note ?? null,
    })
    .returning();

  res.status(201).json(entry);
});

router.patch("/ledger/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid ledger id" });
    return;
  }

  const { status } = req.body as { status?: "outstanding" | "settled" };
  if (!status || !["outstanding", "settled"].includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const [existing] = await db
    .select()
    .from(ledgerEntriesTable)
    .where(eq(ledgerEntriesTable.id, id));

  if (!existing) {
    res.status(404).json({ message: "Ledger entry not found" });
    return;
  }

  if (existing.userId !== req.user!.id) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const [updated] = await db
    .update(ledgerEntriesTable)
    .set({ status })
    .where(eq(ledgerEntriesTable.id, id))
    .returning();

  res.json(updated);
});

router.get("/ledger", async (req: AuthRequest, res): Promise<void> => {
  const period = typeof req.query.period === "string" ? req.query.period : "month";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const start = periodStart(period);

  const conditions = [eq(ledgerEntriesTable.userId, req.user!.id)];

  if (type && (type === "payable" || type === "receivable")) {
    conditions.push(eq(ledgerEntriesTable.type, type as any));
  }

  if (start) {
    conditions.push(gte(ledgerEntriesTable.entryDate, start));
  }

  const entries = await db
    .select()
    .from(ledgerEntriesTable)
    .where(and(...conditions))
    .orderBy(desc(ledgerEntriesTable.entryDate));

  res.json(entries);
});

export default router;
