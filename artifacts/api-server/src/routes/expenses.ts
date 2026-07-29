import { Router, type IRouter } from "express";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";
import {
  createExpense,
  deleteExpenseForUser,
  getExpenseForUser,
  hasDatabase,
  listExpensesForUser,
  updateExpenseForUser,
} from "../lib/devStore";

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

  if (!hasDatabase()) {
    const expense = createExpense({
      userId: req.user!.id,
      title,
      amount,
      category,
      note: note ?? null,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    });

    res.status(201).json(expense);
    return;
  }

  res.status(500).json({ message: "Database-backed expenses require a configured database" });
});

router.get("/expenses", async (req: AuthRequest, res): Promise<void> => {
  if (!hasDatabase()) {
    res.json(listExpensesForUser(req.user!.id));
    return;
  }

  res.status(500).json({ message: "Database-backed expenses require a configured database" });
});

router.get("/expenses/summary", async (req: AuthRequest, res): Promise<void> => {
  if (!hasDatabase()) {
    const expenses = listExpensesForUser(req.user!.id);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const totalTransactions = expenses.length;

    const categories: Record<string, number> = {};
    for (const expense of expenses) {
      categories[expense.category] = (categories[expense.category] ?? 0) + (expense.amount ?? 0);
    }

    res.json({ totalExpenses, totalTransactions, categories });
    return;
  }

  res.status(500).json({ message: "Database-backed expenses require a configured database" });
});

router.get("/expenses/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "Invalid expense id" });
    return;
  }

  if (!hasDatabase()) {
    const expense = getExpenseForUser(req.user!.id, id);
    if (!expense) {
      res.status(404).json({ message: "Expense Not Found" });
      return;
    }

    res.json(expense);
    return;
  }

  res.status(500).json({ message: "Database-backed expenses require a configured database" });
});

router.put("/expenses/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "Invalid expense id" });
    return;
  }

  const { title, amount, category, note, expenseDate } = req.body as {
    title?: string;
    amount?: number;
    category?: string;
    note?: string;
    expenseDate?: string;
  };

  if (!hasDatabase()) {
    const updated = updateExpenseForUser(req.user!.id, id, {
      ...(title !== undefined && { title }),
      ...(amount !== undefined && { amount }),
      ...(category !== undefined && { category }),
      ...(note !== undefined && { note }),
      ...(expenseDate !== undefined && { expenseDate: new Date(expenseDate) }),
    });

    if (!updated) {
      res.status(404).json({ message: "Expense Not Found" });
      return;
    }

    res.json(updated);
    return;
  }

  res.status(500).json({ message: "Database-backed expenses require a configured database" });
});

router.delete("/expenses/:id", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "Invalid expense id" });
    return;
  }

  if (!hasDatabase()) {
    const deleted = deleteExpenseForUser(req.user!.id, id);
    if (!deleted) {
      res.status(404).json({ message: "Expense Not Found" });
      return;
    }

    res.json({ message: "Expense Deleted" });
    return;
  }

  res.status(500).json({ message: "Database-backed expenses require a configured database" });
});

export default router;
