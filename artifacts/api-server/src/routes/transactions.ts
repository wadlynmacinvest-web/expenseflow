import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and, desc, gte, lt } from "drizzle-orm";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.use(authMiddleware);

function periodRange(period?: string, month?: string, year?: string): { start: Date | null; end: Date | null } {
  const now = new Date();

  if (period === "custom" && month && year) {
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    return { start, end };
  }

  if (!period || period === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
  }

  if (period === "bimonth") {
    return { start: new Date(now.getFullYear(), Math.max(0, now.getMonth() - 1), 1), end: null };
  }

  return { start: null, end: null };
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
      transactionDate: transactionDate ? new Date(transactionDate + "T12:00:00Z") : new Date(),
    })
    .returning();

  res.status(201).json(transaction);
});

router.get("/transactions", async (req: AuthRequest, res): Promise<void> => {
  const period = typeof req.query.period === "string" ? req.query.period : "month";
  const type = typeof req.query.type === "string" ? req.query.type : undefined;
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const year = typeof req.query.year === "string" ? req.query.year : undefined;

  const { start, end } = periodRange(period, month, year);

  const conditions = [eq(transactionsTable.userId, req.user!.id)];

  if (type && (type === "revenue" || type === "expense")) {
    conditions.push(eq(transactionsTable.type, type as any));
  }

  if (start) {
    conditions.push(gte(transactionsTable.transactionDate, start));
  }

  if (end) {
    conditions.push(lt(transactionsTable.transactionDate, end));
  }

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.transactionDate));

  res.json(transactions);
});

export default router;
