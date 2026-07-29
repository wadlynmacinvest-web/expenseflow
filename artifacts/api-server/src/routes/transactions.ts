import { Router, type IRouter } from "express";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";
import { createTransaction, hasDatabase, listTransactionsForUser } from "../lib/devStore";

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

router.post("/transactions", async (req: AuthRequest, res): Promise<void> => {
  const { type, title, amount, category, note, transactionDate } = req.body as {
    type: "revenue" | "expense";
    title: string;
    amount: number;
    category: string;
    note?: string;
    transactionDate?: string;
  };

  if (!type || !["revenue", "expense"].includes(type)) {
    res.status(400).json({ message: "type must be revenue or expense" });
    return;
  }

  if (!title || amount == null || !category) {
    res.status(400).json({ message: "title, amount and category are required" });
    return;
  }

  if (!hasDatabase()) {
    const transaction = createTransaction({
      userId: req.user!.id,
      type,
      title,
      amount,
      category,
      note: note ?? null,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    });

    res.status(201).json(transaction);
    return;
  }

  res.status(500).json({ message: "Database-backed transactions require a configured database" });
});

router.get("/transactions", async (req: AuthRequest, res): Promise<void> => {
  const period = typeof req.query.period === "string" ? req.query.period : "month";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const bounds = parsePeriodBounds(period);

  if (!hasDatabase()) {
    const rows = listTransactionsForUser(req.user!.id).filter((row) => {
      if (type && ["revenue", "expense"].includes(type)) {
        if (row.type !== type) {
          return false;
        }
      }

      if (!bounds) {
        return true;
      }

      const date = new Date(row.transactionDate);
      return date >= bounds.start && date <= bounds.end;
    });

    res.json(rows.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()));
    return;
  }

  res.status(500).json({ message: "Database-backed transactions require a configured database" });
});

export default router;
