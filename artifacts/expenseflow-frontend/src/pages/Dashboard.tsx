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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", category: "Food", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", amount: "", category: "Food", note: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
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

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/expenses", {
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        note: form.note || undefined,
      });
      setForm({ title: "", amount: "", category: "Food", note: "" });
      setShowForm(false);
      await load();
    } catch {
      alert("Failed to add expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    if (editingId === id) setEditingId(null);
    await load();
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

  const cancelEdit = () => {
    setEditingId(null);
  };

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
    } catch {
      alert("Failed to update expense.");
    } finally {
      setSaving(false);
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

  const addInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
    background: "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#111827" }}>
              Welcome back, {user?.fullName?.split(" ")[0]} 👋
            </h1>
            <p style={{ color: "#6b7280", marginTop: "2px" }}>Here's your expense overview</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "11px 22px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            {showForm ? "✕ Cancel" : "+ Add Expense"}
          </button>
        </div>

        {/* Summary Cards */}
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

        {/* Add Expense Form */}
        {showForm && (
          <div style={{ ...card({ marginBottom: "24px" }) }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px", color: "#111827" }}>New Expense</h2>
            <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Title</label>
                <input style={addInputStyle} placeholder="e.g. Groceries" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Amount ($)</label>
                <input style={addInputStyle} type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Category</label>
                <select style={addInputStyle} value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Note (optional)</label>
                <input style={addInputStyle} placeholder="Any notes…" value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" disabled={submitting} style={{
                  width: "100%",
                  padding: "10px",
                  background: submitting ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontSize: "0.95rem",
                }}>
                  {submitting ? "Saving…" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        )}

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
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Click "Add Expense" to get started</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {expenses.map((exp) =>
                  editingId === exp.id ? (
                    /* ── Inline edit row ── */
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
                    /* ── Normal row ── */
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
                    <span style={{ fontWeight: 600, color: "#111827" }}>${(amt as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function categoryIcon(category: string) {
  const icons: Record<string, string> = {
    Food: "🍔", Transport: "🚗", Housing: "🏠", Health: "💊",
    Entertainment: "🎬", Shopping: "🛍️", Education: "📚", Other: "📌",
  };
  return icons[category] ?? "📌";
}
