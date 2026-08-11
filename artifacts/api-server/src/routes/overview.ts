import { Router, type IRouter } from "express";
import { db, transactionsTable, ledgerEntriesTable } from "@workspace/db";
import { eq, gte, and } from "drizzle-orm";
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

router.get("/overview", async (req: AuthRequest, res): Promise<void> => {
  const period = typeof req.query.period === "string" ? req.query.period : "month";
  const start = periodStart(period);

  const txConditions = [eq(transactionsTable.userId, req.user!.id)];
  if (start) txConditions.push(gte(transactionsTable.transactionDate, start));
  const transactions = await db.select().from(transactionsTable).where(and(...txConditions));

  const totalRevenue = transactions
    .filter((t) => t.type === "revenue")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  const ledger = await db
    .select()
    .from(ledgerEntriesTable)
    .where(eq(ledgerEntriesTable.userId, req.user!.id));

  const totalDebt = ledger
    .filter((l) => l.type === "payable" && l.status === "outstanding")
    .reduce((s, l) => s + (l.amount ?? 0), 0);
  const totalCredit = ledger
    .filter((l) => l.type === "receivable" && l.status === "outstanding")
    .reduce((s, l) => s + (l.amount ?? 0), 0);

  res.json({ totalRevenue, totalExpenses, totalProfit, totalDebt, totalCredit, period });
});

export default router;
