import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

const CATEGORIES = ["Food", "Transport", "Housing", "Health", "Entertainment", "Shopping", "Education", "Other"];

interface Overview {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalDebt: number;
  totalCredit: number;
  period: string;
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") ?? "{}");
  const [submitting, setSubmitting] = useState(false);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [period, setPeriod] = useState<string>("month");
  const now = new Date();
  const [customMonth, setCustomMonth] = useState<number>(now.getMonth() + 1);
  const [customYear, setCustomYear] = useState<number>(now.getFullYear());

  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"revenue" | "expense" | "payable" | "receivable">("expense");

  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [recentTxLoading, setRecentTxLoading] = useState(true);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [editTxForm, setEditTxForm] = useState({ title: "", amount: "", category: CATEGORIES[0], date: "" });
  const [savingTx, setSavingTx] = useState(false);

  const [editingLedgerId, setEditingLedgerId] = useState<number | null>(null);
  const [editLedgerForm, setEditLedgerForm] = useState({ counterpartyName: "", amount: "", dueDate: "" });
  const [savingLedger, setSavingLedger] = useState(false);

  const periodQuery = () =>
    period === "custom"
      ? `period=custom&month=${customMonth}&year=${customYear}`
      : `period=${encodeURIComponent(period)}`;

  const loadOverview = async () => {
    setOverviewLoading(true);
    try {
      const res = await api.get(`/overview?${periodQuery()}`);
      setOverview(res.data);
    } catch {
      // ignore
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadRecentTx = async () => {
    setRecentTxLoading(true);
    try {
      const res = await api.get(`/transactions?${periodQuery()}`);
      setRecentTx(res.data);
    } catch {
      // ignore
    } finally {
      setRecentTxLoading(false);
    }
  };

  const loadLedger = async () => {
    setLedgerLoading(true);
    try {
      const res = await api.get(`/ledger?period=all`);
      setLedgerEntries(res.data);
    } catch {
      // ignore
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => { loadOverview(); loadRecentTx(); loadLedger(); }, []);

  useEffect(() => { loadOverview(); loadRecentTx(); }, [period, customMonth, customYear]);

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
      await loadOverview();
      await loadRecentTx();
      await loadLedger();
    } catch (err) {
      alert("Failed to save.\n" + (err as any)?.message ?? "");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSettled = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "settled" ? "outstanding" : "settled";
    try {
      await api.patch(`/ledger/${id}`, { status: nextStatus });
      await loadLedger();
      await loadOverview();
    } catch {
      alert("Failed to update status.");
    }
  };

  const startEditTx = (tx: any) => {
    setEditingTxId(tx.id);
    setEditTxForm({
      title: tx.title,
      amount: String(tx.amount),
      category: tx.category,
      date: toLocalDateInput(new Date(tx.transactionDate)),
    });
  };

  const cancelEditTx = () => setEditingTxId(null);

  const saveEditTx = async (id: number) => {
    setSavingTx(true);
    try {
      await api.put(`/transactions/${id}`, {
        title: editTxForm.title,
        amount: parseFloat(editTxForm.amount),
        category: editTxForm.category,
        transactionDate: editTxForm.date,
      });
      setEditingTxId(null);
      await loadRecentTx();
      await loadOverview();
    } catch {
      alert("Failed to update transaction.");
    } finally {
      setSavingTx(false);
    }
  };

  const deleteTx = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      await loadRecentTx();
      await loadOverview();
    } catch {
      alert("Failed to delete transaction.");
    }
  };

  const startEditLedger = (entry: any) => {
    setEditingLedgerId(entry.id);
    setEditLedgerForm({
      counterpartyName: entry.counterpartyName,
      amount: String(entry.amount),
      dueDate: entry.dueDate ? toLocalDateInput(new Date(entry.dueDate)) : "",
    });
  };

  const cancelEditLedger = () => setEditingLedgerId(null);

  const saveEditLedger = async (id: number) => {
    setSavingLedger(true);
    try {
      await api.put(`/ledger/${id}`, {
        counterpartyName: editLedgerForm.counterpartyName,
        amount: parseFloat(editLedgerForm.amount),
        dueDate: editLedgerForm.dueDate || undefined,
      });
      setEditingLedgerId(null);
      await loadLedger();
      await loadOverview();
    } catch {
      alert("Failed to update entry.");
    } finally {
      setSavingLedger(false);
    }
  };

  const deleteLedger = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await api.delete(`/ledger/${id}`);
      await loadLedger();
      await loadOverview();
    } catch {
      alert("Failed to delete entry.");
    }
  };

  const budgetRemaining = user.monthlyBudget && overview
    ? user.monthlyBudget - overview.totalExpenses
    : null;

  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

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

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "6px", borderRadius: "8px", border: "1px solid #e5e7eb", flexWrap: "wrap" }}>
              <label style={{ fontSize: "0.85rem", color: "#6b7280", marginRight: "6px" }}>Period</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff" }}>
                <option value="month">This Month</option>
                <option value="bimonth">Last 2 Months</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Month</option>
              </select>
              {period === "custom" && (
                <>
                  <select value={customMonth} onChange={e => setCustomMonth(parseInt(e.target.value, 10))} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff" }}>
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={customYear} onChange={e => setCustomYear(parseInt(e.target.value, 10))} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #d1d5db", background: "#fff" }}>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </>
              )}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Revenue</p>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, overflowWrap: "break-word", color: "#047857", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalRevenue ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Expenses</p>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, overflowWrap: "break-word", color: "#dc2626", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalExpenses ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Profit</p>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, overflowWrap: "break-word", marginTop: "6px", color: overview && overview.totalProfit >= 0 ? "#059669" : "#ef4444" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalProfit ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Debt (You Owe)</p>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, overflowWrap: "break-word", color: "#ea580c", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalDebt ?? 0)}
            </p>
          </div>

          <div style={card()}>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Credit (Owed to You)</p>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, overflowWrap: "break-word", color: "#0ea5a4", marginTop: "6px" }}>
              {overviewLoading ? "—" : formatCurrency(overview?.totalCredit ?? 0)}
            </p>
          </div>

          {budgetRemaining !== null && (
            <div style={card()}>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget Left</p>
              <p style={{
                fontSize: "1.05rem", fontWeight: 800, overflowWrap: "break-word", marginTop: "6px",
                color: budgetRemaining >= 0 ? "#059669" : "#dc2626",
              }}>
                {formatCurrency(budgetRemaining)}
              </p>
            </div>
          )}
        </div>

        {/* Recent Transactions + Debts & Credits */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "20px" }}>
          <div style={card()}>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px", color: "#111827" }}>
              Recent Transactions
            </h2>
            {recentTxLoading ? (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Loading…</p>
            ) : recentTx.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: "2rem", marginBottom: "6px" }}>💳</div>
                <p style={{ fontWeight: 600 }}>No transactions yet</p>
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Use "Add Transaction" to log revenue or an expense</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
                {(["revenue", "expense"] as const).map((t) => {
                  const group = recentTx.filter((tx: any) => tx.type === t);
                  if (group.length === 0) return null;
                  return (
                    <div key={t}>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0 6px" }}>
                        {t === "revenue" ? "Revenue" : "Expense"}
                      </p>
                      {group.map((tx: any) =>
                        editingTxId === tx.id ? (
                          <div
                            key={tx.id}
                            style={{
                              padding: "12px",
                              background: "#eff6ff",
                              borderRadius: "8px",
                              border: "1.5px solid #bfdbfe",
                              marginBottom: "6px",
                            }}
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "8px", marginBottom: "8px" }}>
                              <input style={inputStyle} value={editTxForm.title} onChange={e => setEditTxForm({ ...editTxForm, title: e.target.value })} />
                              <input style={inputStyle} type="number" step="0.01" value={editTxForm.amount} onChange={e => setEditTxForm({ ...editTxForm, amount: e.target.value })} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                              <select style={inputStyle} value={editTxForm.category} onChange={e => setEditTxForm({ ...editTxForm, category: e.target.value })}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                              </select>
                              <input style={inputStyle} type="date" value={editTxForm.date} onChange={e => setEditTxForm({ ...editTxForm, date: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button onClick={cancelEditTx} style={{ padding: "6px 12px", background: "#fff", border: "1.5px solid #d1d5db", borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
                              <button onClick={() => saveEditTx(tx.id)} disabled={savingTx} style={{ padding: "6px 14px", background: savingTx ? "#93c5fd" : "#2563eb", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem", color: "#fff", cursor: savingTx ? "not-allowed" : "pointer" }}>{savingTx ? "Saving…" : "Save"}</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={tx.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: "#f9fafb",
                              marginBottom: "6px",
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: 600, color: "#111827", fontSize: "0.92rem" }}>{tx.title}</p>
                              <p style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                                {tx.category} · {new Date(tx.transactionDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: tx.type === "revenue" ? "#059669" : "#ef4444",
                                }}
                              >
                                {tx.type === "revenue" ? "+" : "-"}{formatCurrency(tx.amount)}
                              </span>
                              <button onClick={() => startEditTx(tx)} title="Edit" style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.9rem", padding: "2px 4px" }}>✏️</button>
                              <button onClick={() => deleteTx(tx.id)} title="Delete" style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "0.95rem", padding: "2px 4px" }}>✕</button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={card()}>
            <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "16px", color: "#111827" }}>
              Debts & Credits
            </h2>
            {ledgerLoading ? (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Loading…</p>
            ) : ledgerEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🤝</div>
                <p style={{ fontWeight: 600 }}>No debts or credits yet</p>
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Use "Add Transaction" to log a debt or credit</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
                {(["outstanding", "settled"] as const).map((s) => {
                  const group = ledgerEntries.filter((e: any) => e.status === s);
                  if (group.length === 0) return null;
                  return (
                    <div key={s}>
                      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0 6px" }}>
                        {s === "outstanding" ? "Outstanding" : "Settled"}
                      </p>
                      {group.map((entry: any) =>
                        editingLedgerId === entry.id ? (
                          <div
                            key={entry.id}
                            style={{
                              padding: "12px",
                              background: "#eff6ff",
                              borderRadius: "8px",
                              border: "1.5px solid #bfdbfe",
                              marginBottom: "6px",
                            }}
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: "8px", marginBottom: "8px" }}>
                              <input style={inputStyle} value={editLedgerForm.counterpartyName} onChange={e => setEditLedgerForm({ ...editLedgerForm, counterpartyName: e.target.value })} />
                              <input style={inputStyle} type="number" step="0.01" value={editLedgerForm.amount} onChange={e => setEditLedgerForm({ ...editLedgerForm, amount: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: "8px" }}>
                              <input style={inputStyle} type="date" value={editLedgerForm.dueDate} onChange={e => setEditLedgerForm({ ...editLedgerForm, dueDate: e.target.value })} />
                            </div>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button onClick={cancelEditLedger} style={{ padding: "6px 12px", background: "#fff", border: "1.5px solid #d1d5db", borderRadius: "6px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>Cancel</button>
                              <button onClick={() => saveEditLedger(entry.id)} disabled={savingLedger} style={{ padding: "6px 14px", background: savingLedger ? "#93c5fd" : "#2563eb", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "0.8rem", color: "#fff", cursor: savingLedger ? "not-allowed" : "pointer" }}>{savingLedger ? "Saving…" : "Save"}</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            key={entry.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: entry.status === "settled" ? "#f0fdf4" : "#f9fafb",
                              marginBottom: "6px",
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: 600, color: "#111827", fontSize: "0.92rem" }}>
                                {entry.counterpartyName}
                              </p>
                              <p style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                                {entry.type === "payable" ? "You owe" : "Owed to you"}
                                {entry.dueDate ? ` · due ${new Date(entry.dueDate).toLocaleDateString()}` : ""}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: entry.type === "payable" ? "#f97316" : "#0d9488",
                                }}
                              >
                                {formatCurrency(entry.amount)}
                              </span>
                              <button
                                onClick={() => handleMarkSettled(entry.id, entry.status)}
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #d1d5db",
                                  background: entry.status === "settled" ? "#dcfce7" : "#fff",
                                  color: entry.status === "settled" ? "#166534" : "#374151",
                                  cursor: "pointer",
                                }}
                              >
                                {entry.status === "settled" ? "Settled" : "Mark Settled"}
                              </button>
                              <button onClick={() => startEditLedger(entry)} title="Edit" style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.9rem", padding: "2px 4px" }}>✏️</button>
                              <button onClick={() => deleteLedger(entry.id)} title="Delete" style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "0.95rem", padding: "2px 4px" }}>✕</button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
            <div style={{ width: "720px", maxWidth: "96%", background: "#fff", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Add Transaction</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <button onClick={() => setAddType("revenue")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "revenue" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Revenue</button>
                <button onClick={() => setAddType("expense")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "expense" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Expense</button>
                <button onClick={() => setAddType("payable")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "payable" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Debt</button>
                <button onClick={() => setAddType("receivable")} style={{ padding: "8px 12px", borderRadius: "8px", border: addType === "receivable" ? "2px solid #2563eb" : "1px solid #e5e7eb", background: "#fff" }}>Log Credit</button>
              </div>

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
  const [date, setDate] = useState<string | null>(toLocalDateInput(new Date()));

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

function toLocalDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatCurrency(val: number) {
  const sign = val < 0 ? "-" : "";
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}₦${formatted}`;
}
