import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Navbar from "../components/Navbar";
import api from "../services/api";

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORIES = ["Food", "Transport", "Housing", "Health", "Entertainment", "Shopping", "Education", "Other"];
const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#6b7280"];

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  note?: string | null;
  expenseDate: string;
}

interface Summary {
  totalExpenses: number;
  totalTransactions: number;
  categories: Record<string, number>;
}

interface Overview {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalDebt: number;
  totalCredit: number;
  period: string;
}

interface EditForm {
  title: string;
  amount: string;
  category: string;
  note: string;
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid #e5e7eb",
  ...style,
});

const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: "1.5px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "0.9rem",
  outline: "none",
  background: "#fff",
  width: "100%",
};

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") ?? "{}");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", amount: "", category: "Food", note: "" });
  const [saving, setSaving] = useState(false);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [period, setPeriod] = useState<string>("month");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"revenue" | "expense" | "payable" | "receivable">("expense");

  const load = async () => {
    setLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/expenses/summary"),
      ]);
      setExpenses(expRes.data);
      setSummary(sumRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async (p = period) => {
    setOverviewLoading(true);
    try {
      const res = await api.get(`/overview?period=${encodeURIComponent(p)}`);
      setOverview(res.data);
    } catch (err) {
      // ignore
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => { load(); loadOverview(); }, []);

  useEffect(() => { loadOverview(period); }, [period]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    if (editingId === id) setEditingId(null);
    await load();
    await loadOverview();
  };

  const startEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setEditForm({
      title: exp.title,
      amount: String(exp.amount),
      category: exp.category,
      note: exp.note ?? "",
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const handleSaveEdit = async (id: number) => {
    setSaving(true);
    try {
      await api.put(`/expenses/${id}`, {
        title: editForm.title,
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        note: editForm.note || undefined,
      });
      setEditingId(null);
      await load();
      await loadOverview();
    } catch {
      alert("Failed to update expense.");
    } finally {
      setSaving(false);
    }
  };

  // Add Transaction / Ledger submit handlers
  const handleAddTransaction = async (payload: any) => {
    setSubmitting(true);
    try {
      if (payload._endpoint === "transactions") {
        await api.post("/transactions", payload.body);
      } else {
        await api.post("/ledger", payload.body);
      }
      setShowAddModal(false);
      alert("Saved successfully");
      await load();
      await loadOverview();
    } catch (err) {
      alert("Failed to save.\n" + (err as any)?.message ?? "");
    } finally {
      setSubmitting(false);
    }
  };

  const budgetRemaining = user.monthlyBudget
    ? user.monthlyBudget - (summary?.totalExpenses ?? 0)
    : null;

  const chartData = summary && Object.keys(summary.categories).length > 0
    ? {
        labels: Object.keys(summary.categories),
        datasets: [{
          data: Object.values(summary.categories),
          backgroundColor: CHART_COLORS.slice(0, Object.keys(summary.categories).length),
          borderWidth: 2,
          borderColor: "#fff",
        }],
      }
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111827" }}>
              Welcome back, {user?.fullName?.split(" ")[0]} 👋
            </h1>
            <p style={{ color: "#6b7280", marginTop: "2px" }}>Business overview</p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "6px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <label style={{ fontSize: "0.85rem", color: "#6b7280", marginRight: "6px" }}>Period</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff" }}>
                <option value="month">This Month</option>
                <option value="bimonth">Last 2 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <button
              onClick={() => { setShowAddModal(true); setAddType("expense"); }}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "11px 18px",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {/* Overview cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Revenue</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#047857", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalRevenue ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Expenses</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#dc2626", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalExpenses ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Profit</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px", color: overview && overview.totalProfit >= 0 ? "#059669" : "#ef4444" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalProfit ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Debt (You Owe)</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ea580c", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalDebt ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Credit (Owed to You)</p>
            <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0ea5a4", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalCredit ?? 0)}
            </p>
          </div>
        </div>

        {/* Existing small summary cards (kept) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Spent</p>
            <p style={{ fontSize: "1.9rem", fontWeight: 800, color: "#111827", marginTop: "6px" }}>
              ${(summary?.totalExpenses ?? 0).toFixed(2)}
            </p>
          </div>
          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Transactions</p>
            <p style={{ fontSize: "1.9rem", fontWeight: 800, color: "#111827", marginTop: "6px" }}>
              {summary?.totalTransactions ?? 0}
            </p>
          </div>
          {budgetRemaining !== null && (
            <div style={card()}>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget Left</p>
              <p style={{
                fontSize: "1.9rem", fontWeight: 800, marginTop: "6px",
                color: budgetRemaining >= 0 ? "#059669" : "#dc2626",
              }}>
                ${budgetRemaining.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: "grid", gridTemplateColumns: chartData ? "1fr 320px" : "1fr", gap: "20px", alignItems: "start" }}>

          {/* Expense List */}
          <div style={card()}>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px", color: "#111827" }}>
              Recent Expenses
              {expenses.length > 0 && (
                <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "#9ca3af", marginLeft: "8px" }}>
                  click ✏️ to edit
                </span>
              )}
            </h2>
            {loading ? (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "32px 0" }}>Loading…</p>
            ) : expenses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🧾</div>
                <p style={{ fontWeight: 600 }}>No expenses yet</p>
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Click "Add Transaction" to get started</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {expenses.map((exp) =>
                  editingId === exp.id ? (
                    /* Inline edit row */
                    <div key={exp.id} style={{
                      padding: "16px",
                      background: "#eff6ff",
                      borderRadius: "10px",
                      border: "1.5px solid #bfdbfe",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "3px" }}>Title</label>
                          <input
                            style={inputStyle}
                            value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "3px" }}>Amount ($)</label>
                          <input
                            style={inputStyle}
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.amount}
                            onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "3px" }}>Category</label>
                          <select
                            style={inputStyle}
                            value={editForm.category}
                            onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          >
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "3px" }}>Note (optional)</label>
                        <input
                          style={inputStyle}
                          placeholder="Any notes…"
                          value={editForm.note}
                          onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: "7px 16px",
                            background: "#fff",
                            border: "1.5px solid #d1d5db",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            color: "#374151",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(exp.id)}
                          disabled={saving}
                          style={{
                            padding: "7px 18px",
                            background: saving ? "#93c5fd" : "#2563eb",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: saving ? "not-allowed" : "pointer",
                            color: "#fff",
                          }}
                        >
                          {saving ? "Saving…" : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal row */
                    <div key={exp.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #f3f4f6",
                      transition: "background 0.1s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "8px",
                          background: "#eff6ff", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "1.1rem", flexShrink: 0,
                        }}>
                          {categoryIcon(exp.category)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{exp.title}</p>
                          <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>
                            {exp.category} · {new Date(exp.expenseDate).toLocaleDateString()}
                            {exp.note && <span style={{ fontStyle: "italic" }}> · {exp.note}</span>}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700, color: "#111827", fontSize: "1rem", marginRight: "4px" }}>
                          ${exp.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => startEdit(exp)}
                          title="Edit"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#9ca3af",
                            cursor: "pointer",
                            fontSize: "1rem",
                            padding: "4px 6px",
                            borderRadius: "4px",
                            transition: "color 0.15s",
                          }}
                          onMouseOver={e => (e.currentTarget.style.color = "#2563eb")}
                          onMouseOut={e => (e.currentTarget.style.color = "#9ca3af")}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          title="Delete"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#d1d5db",
                            cursor: "pointer",
                            fontSize: "1.05rem",
                            padding: "4px 6px",
                            borderRadius: "4px",
                            transition: "color 0.15s",
                          }}
                          onMouseOver={e => (e.currentTarget.style.color = "#ef4444")}
                          onMouseOut={e => (e.currentTarget.style.color = "#d1d5db")}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          {chartData && (
            <div style={card()}>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px", color: "#111827" }}>
                By Category
              </h2>
              <Pie data={chartData} options={{ plugins: { legend: { position: "bottom", labels: { padding: 12, font: { size: 12 } } } } }} />
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(summary!.categories).map(([cat, amt], i) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#374151" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length], display: "inline-block" }} />
                      {cat}
                    </span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(amt as number)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
            <div style={{ width: "720px", maxWidth: "96%", background: "#fff", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Add Transaction</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button onClick={() => setAddType("revenue")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "revenue" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Revenue</button>
                <button onClick={() => setAddType("expense")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "expense" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Expense</button>
                <button onClick={() => setAddType("payable")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "payable" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Debt</button>
                <button onClick={() => setAddType("receivable")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "receivable" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Credit</button>
              </div>

              {/* Form */}
              {addType === "revenue" || addType === "expense" ? (
                <TransactionForm onSubmit={handleAddTransaction} type={addType} submitting={submitting} />
              ) : (
                <LedgerForm onSubmit={handleAddTransaction} type={addType} submitting={submitting} />
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function TransactionForm({ onSubmit, type, submitting }: { onSubmit: (payload: any) => Promise<void>; type: "revenue" | "expense"; submitting: boolean }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState<string | null>(new Date().toISOString().slice(0, 10));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await onSubmit({ _endpoint: "transactions", body: { type, title, amount: parseFloat(amount), category, note: note || undefined, transactionDate: date } });
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "10px" }}>
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required />
        </div>
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Amount</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} type="number" step="0.01" min="0" required />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Date</label>
          <input type="date" value={date ?? ""} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Note (optional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button type="submit" disabled={submitting} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: submitting ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700 }}>{submitting ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}

function LedgerForm({ onSubmit, type, submitting }: { onSubmit: (payload: any) => Promise<void>; type: "payable" | "receivable"; submitting: boolean }) {
  const [counterpartyName, setCounterpartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await onSubmit({ _endpoint: "ledger", body: { type, counterpartyName, amount: parseFloat(amount), dueDate: dueDate ?? undefined, note: note || undefined } });
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: "10px" }}>
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>{type === "payable" ? "Who you owe" : "Who owes you"}</label>
          <input value={counterpartyName} onChange={e => setCounterpartyName(e.target.value)} style={inputStyle} required />
        </div>
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Amount</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} type="number" step="0.01" min="0" required />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
        <div>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Due Date (optional)</label>
          <input type="date" value={dueDate ?? ""} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Note (optional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button type="submit" disabled={submitting} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: submitting ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700 }}>{submitting ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}

function formatCurrency(val: number) {
  // Try to detect existing formatting in app — default to Naira if not available
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "NGN" }).format(val);
  } catch {
    return `₦${val.toFixed(2)}`;
  }
}

function categoryIcon(category: string) {
  const icons: Record<string, string> = {
    Food: "🍔", Transport: "🚗", Housing: "🏠", Health: "💊",
    Entertainment: "🎬", Shopping: "🛍️", Education: "📚", Other: "📌",
  };
  return icons[category] ?? "📌";
}
