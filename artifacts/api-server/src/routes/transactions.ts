import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
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
    // first day of previous month (includes current and previous month)
    return new Date(now.getFullYear(), Math.max(0, now.getMonth() - 1), 1);
  }
  return null; // 'all' or unknown
}

router.post("/transactions", async (req: AuthRequest, res): Promise<void> => {
  const { type, title, amount, category, note, transactionDate } = req.body as {
    type: "revenue" | "expense";
    title: string;
    amount: number;
    category: string;
    note?: string;
    transactionDate?: string;
  };

  if (!type || !["revenue", "expense"].includes(type) || !title || amount == null || !category) {
    res.status(400).json({ message: "type, title, amount and category are required" });
    return;
  }

  const [transaction] = await db
    .insert(transactionsTable)
    .values({
      userId: req.user!.id,
      type,
      title,
      amount,
      category,
      note: note ?? null,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    })
    .returning();

  res.status(201).json(transaction);
});

router.get("/transactions", async (req: AuthRequest, res): Promise<void> => {
  const period = typeof req.query.period === "string" ? req.query.period : "month";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const start = periodStart(period);

  let q = db.select().from(transactionsTable).where(eq(transactionsTable.userId, req.user!.id));

  if (type && (type === "revenue" || type === "expense")) {
    q = q.where(eq(transactionsTable.type, type as any));
  }

  if (start) {
    q = q.where(gte(transactionsTable.transactionDate, start));
  }

  const transactions = await q.orderBy(desc(transactionsTable.transactionDate));

  res.json(transactions);
});

export default router;
