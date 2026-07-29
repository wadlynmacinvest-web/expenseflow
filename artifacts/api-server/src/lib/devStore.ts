import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = path.resolve(__dirname, "../../.dev-data.json");

export interface DevUser {
  id: number;
  fullName: string;
  email: string;
  password: string;
  monthlyBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevExpense {
  id: number;
  userId: number;
  title: string;
  amount: number;
  category: string;
  note: string | null;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevTransaction {
  id: number;
  userId: number;
  type: "revenue" | "expense";
  title: string;
  amount: number;
  category: string;
  note: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevLedgerEntry {
  id: number;
  userId: number;
  type: "payable" | "receivable";
  counterpartyName: string;
  amount: number;
  status: "outstanding" | "settled";
  dueDate: Date | null;
  note: string | null;
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface DevStoreState {
  users: DevUser[];
  expenses: DevExpense[];
  transactions: DevTransaction[];
  ledgerEntries: DevLedgerEntry[];
  nextUserId: number;
  nextExpenseId: number;
  nextTransactionId: number;
  nextLedgerEntryId: number;
}

let cache: DevStoreState | null = null;

const defaultState = (): DevStoreState => ({
  users: [],
  expenses: [],
  transactions: [],
  ledgerEntries: [],
  nextUserId: 1,
  nextExpenseId: 1,
  nextTransactionId: 1,
  nextLedgerEntryId: 1,
});

function loadState(): DevStoreState {
  if (cache) {
    return cache;
  }

  if (!fs.existsSync(dataFilePath)) {
    cache = defaultState();
    return cache;
  }

  try {
    const raw = fs.readFileSync(dataFilePath, "utf8");
    const parsed = JSON.parse(raw) as DevStoreState;
    cache = {
      ...defaultState(),
      ...parsed,
      users: parsed.users ?? [],
      expenses: parsed.expenses ?? [],
      transactions: parsed.transactions ?? [],
      ledgerEntries: parsed.ledgerEntries ?? [],
    };
    return cache;
  } catch {
    cache = defaultState();
    return cache;
  }
}

function persistState(state: DevStoreState): void {
  fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2));
}

function nowIso(): Date {
  return new Date();
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function createUser(input: Omit<DevUser, "id" | "createdAt" | "updatedAt">): DevUser {
  const state = loadState();
  const user: DevUser = {
    id: state.nextUserId,
    ...input,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.users.push(user);
  state.nextUserId += 1;
  persistState(state);
  return user;
}

export function findUserByEmail(email: string): DevUser | null {
  return loadState().users.find((user) => user.email === email) ?? null;
}

export function getUserById(id: number): DevUser | null {
  return loadState().users.find((user) => user.id === id) ?? null;
}

export function updateUser(id: number, updates: Partial<DevUser>): DevUser | null {
  const state = loadState();
  const index = state.users.findIndex((user) => user.id === id);
  if (index === -1) {
    return null;
  }

  state.users[index] = { ...state.users[index], ...updates, updatedAt: nowIso() };
  persistState(state);
  return state.users[index];
}

export function listExpensesForUser(userId: number): DevExpense[] {
  return loadState().expenses
    .filter((expense) => expense.userId === userId)
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
}

export function createExpense(input: Omit<DevExpense, "id" | "createdAt" | "updatedAt">): DevExpense {
  const state = loadState();
  const expense: DevExpense = {
    id: state.nextExpenseId,
    ...input,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.expenses.push(expense);
  state.nextExpenseId += 1;
  persistState(state);
  return expense;
}

export function getExpenseForUser(userId: number, id: number): DevExpense | null {
  return loadState().expenses.find((expense) => expense.userId === userId && expense.id === id) ?? null;
}

export function updateExpenseForUser(userId: number, id: number, updates: Partial<DevExpense>): DevExpense | null {
  const state = loadState();
  const index = state.expenses.findIndex((expense) => expense.userId === userId && expense.id === id);
  if (index === -1) {
    return null;
  }

  state.expenses[index] = { ...state.expenses[index], ...updates, updatedAt: nowIso() };
  persistState(state);
  return state.expenses[index];
}

export function deleteExpenseForUser(userId: number, id: number): boolean {
  const state = loadState();
  const index = state.expenses.findIndex((expense) => expense.userId === userId && expense.id === id);
  if (index === -1) {
    return false;
  }

  state.expenses.splice(index, 1);
  persistState(state);
  return true;
}

export function listTransactionsForUser(userId: number): DevTransaction[] {
  return loadState().transactions.filter((transaction) => transaction.userId === userId);
}

export function createTransaction(input: Omit<DevTransaction, "id" | "createdAt" | "updatedAt">): DevTransaction {
  const state = loadState();
  const transaction: DevTransaction = {
    id: state.nextTransactionId,
    ...input,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.transactions.push(transaction);
  state.nextTransactionId += 1;
  persistState(state);
  return transaction;
}

export function createLedgerEntry(input: Omit<DevLedgerEntry, "id" | "createdAt" | "updatedAt">): DevLedgerEntry {
  const state = loadState();
  const entry: DevLedgerEntry = {
    id: state.nextLedgerEntryId,
    ...input,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.ledgerEntries.push(entry);
  state.nextLedgerEntryId += 1;
  persistState(state);
  return entry;
}

export function listLedgerEntriesForUser(userId: number): DevLedgerEntry[] {
  return loadState().ledgerEntries.filter((entry) => entry.userId === userId);
}

export function updateLedgerEntryForUser(userId: number, id: number, status: "outstanding" | "settled"): DevLedgerEntry | null {
  const state = loadState();
  const index = state.ledgerEntries.findIndex((entry) => entry.userId === userId && entry.id === id);
  if (index === -1) {
    return null;
  }

  state.ledgerEntries[index] = { ...state.ledgerEntries[index], status, updatedAt: nowIso() };
  persistState(state);
  return state.ledgerEntries[index];
}

export function getOverviewSummaryForUser(userId: number, period: string): {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalDebt: number;
  totalCredit: number;
  period: string;
} {
  const state = loadState();
  const transactions = state.transactions.filter((transaction) => transaction.userId === userId);
  const ledgerEntries = state.ledgerEntries.filter((entry) => entry.userId === userId && entry.status === "outstanding");
  const now = new Date();
  let start: Date | null = null;

  if (period === "bimonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const filteredTransactions = start
    ? transactions.filter((transaction) => new Date(transaction.transactionDate) >= start! && new Date(transaction.transactionDate) <= now)
    : transactions;

  const totalRevenue = filteredTransactions.reduce((sum, item) => sum + (item.type === "revenue" ? item.amount : 0), 0);
  const totalExpenses = filteredTransactions.reduce((sum, item) => sum + (item.type === "expense" ? item.amount : 0), 0);

  return {
    totalRevenue,
    totalExpenses,
    totalProfit: totalRevenue - totalExpenses,
    totalDebt: ledgerEntries.reduce((sum, item) => sum + (item.type === "payable" ? item.amount : 0), 0),
    totalCredit: ledgerEntries.reduce((sum, item) => sum + (item.type === "receivable" ? item.amount : 0), 0),
    period,
  };
}
