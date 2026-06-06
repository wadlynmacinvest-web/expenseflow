import { Router, type IRouter } from "express";
import { db, expensesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.use(authMiddleware);

router.post("/expenses", async (req: AuthRequest, res): Promise<void> => {
  const { title, amount, category, note, expenseDate } = req.body as {
    title: string;
    amount: number;
    category: string;
    note?: string;
    expenseDate?: string;
  };

  if (!title || amount == null || !category) {
    res.status(400).json({ message: "title, amount and category are required" });
    return;
  }

  const [expense] = await db
    .insert(expensesTable)
    .values({
      userId: req.user!.id,
      title,
      amount,
      category,
      note: note ?? null,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    })
    .returning();

  res.status(201).json(expense);
});

router.get("/expenses", async (req: AuthRequest, res): Promise<void> => {
  const expenses = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.userId, req.user!.id))
    .orderBy(desc(expensesTable.expenseDate));

  res.json(expenses);
});

router.get("/expenses/summary", async (req: AuthRequest, res): Promise<void> => {
  const expenses = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.userId, req.user!.id));

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const totalTransactions = expenses.length;

  const categories: Record<string, number> = {};
  for (const expense of expenses) {
    categories[expense.category] = (categories[expense.category] ?? 0) + (expense.amount ?? 0);
  }

  res.json({ totalExpenses, totalTransactions, categories });
});

router.get("/expenses/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid expense id" });
    return;
  }

  const [expense] = await db
    .select()
    .from(expensesTable)
    .where(and(eq(expensesTable.id, id), eq(expensesTable.userId, req.user!.id)));

  if (!expense) {
    res.status(404).json({ message: "Expense Not Found" });
    return;
  }

  res.json(expense);
});

router.put("/expenses/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid expense id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.id, id));

  if (!existing) {
    res.status(404).json({ message: "Expense Not Found" });
    return;
  }

  if (existing.userId !== req.user!.id) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { title, amount, category, note, expenseDate } = req.body as {
    title?: string;
    amount?: number;
    category?: string;
    note?: string;
    expenseDate?: string;
  };

  const [updated] = await db
    .update(expensesTable)
    .set({
      ...(title !== undefined && { title }),
      ...(amount !== undefined && { amount }),
      ...(category !== undefined && { category }),
      ...(note !== undefined && { note }),
      ...(expenseDate !== undefined && { expenseDate: new Date(expenseDate) }),
    })
    .where(eq(expensesTable.id, id))
    .returning();

  res.json(updated);
});

router.delete("/expenses/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid expense id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(expensesTable)
    .where(eq(expensesTable.id, id));

  if (!existing) {
    res.status(404).json({ message: "Expense Not Found" });
    return;
  }

  if (existing.userId !== req.user!.id) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  await db.delete(expensesTable).where(eq(expensesTable.id, id));

  res.json({ message: "Expense Deleted" });
});

export default router;
