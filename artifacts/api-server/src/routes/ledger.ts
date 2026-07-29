import { Router, type IRouter } from "express";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";
import { createLedgerEntry, hasDatabase, listLedgerEntriesForUser, updateLedgerEntryForUser } from "../lib/devStore";

const router: IRouter = Router();

router.use(authMiddleware);

const parsePeriodBounds = (period: string | undefined) => {
  const now = new Date();

  if (period === "bimonth") {
    return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: now };
  }

  if (period === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }

  return null;
};

router.post("/ledger", async (req: AuthRequest, res): Promise<void> => {
  const { type, counterpartyName, amount, dueDate, note } = req.body as {
    type: "payable" | "receivable";
    counterpartyName: string;
    amount: number;
    dueDate?: string;
    note?: string;
  };

  if (!type || !["payable", "receivable"].includes(type)) {
    res.status(400).json({ message: "type must be payable or receivable" });
    return;
  }

  if (!counterpartyName || amount == null) {
    res.status(400).json({ message: "counterpartyName and amount are required" });
    return;
  }

  if (!hasDatabase()) {
    const entry = createLedgerEntry({
      userId: req.user!.id,
      type,
      counterpartyName,
      amount,
      status: "outstanding",
      dueDate: dueDate ? new Date(dueDate) : null,
      note: note ?? null,
      entryDate: new Date(),
    });

    res.status(201).json(entry);
    return;
  }

  res.status(500).json({ message: "Database-backed ledger requires a configured database" });
});

router.patch("/ledger/:id", async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number.parseInt(rawId, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "Invalid ledger entry id" });
    return;
  }

  const { status } = req.body as { status?: "outstanding" | "settled" };

  if (!status || !["outstanding", "settled"].includes(status)) {
    res.status(400).json({ message: "status must be outstanding or settled" });
    return;
  }

  if (!hasDatabase()) {
    const updated = updateLedgerEntryForUser(req.user!.id, id, status);
    if (!updated) {
      res.status(404).json({ message: "Ledger entry not found" });
      return;
    }

    res.json(updated);
    return;
  }

  res.status(500).json({ message: "Database-backed ledger requires a configured database" });
});

router.get("/ledger", async (req: AuthRequest, res): Promise<void> => {
  const period = typeof req.query.period === "string" ? req.query.period : "month";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const bounds = parsePeriodBounds(period);

  if (!hasDatabase()) {
    const rows = listLedgerEntriesForUser(req.user!.id).filter((row) => {
      if (type && ["payable", "receivable"].includes(type)) {
        if (row.type !== type) {
          return false;
        }
      }

      if (!bounds) {
        return true;
      }

      const date = new Date(row.entryDate);
      return date >= bounds.start && date <= bounds.end;
    });

    res.json(rows.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()));
    return;
  }

  res.status(500).json({ message: "Database-backed ledger requires a configured database" });
});

export default router;
