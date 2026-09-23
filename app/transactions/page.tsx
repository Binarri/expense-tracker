"use client";

import { useState, useEffect } from "react";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  transactionDate: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  async function fetchTransactions() {
    setLoading(true);

    const url =
      filter === "all"
        ? "/api/transactions"
        : `/api/transactions?type=${filter}`;

    const res = await fetch(url);
    const data = await res.json();

    setTransactions(data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: Number(amount),
        description,
        transactionDate,
      }),
    });

    if (res.ok) {
      setAmount("");
      setDescription("");
      setTransactionDate("");
      fetchTransactions();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;

    const res = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });

    if (res.ok) fetchTransactions();
  }

  function startEdit(t: Transaction) {
    setEditingId(t.id);
    setEditType(t.type);
    setEditAmount(String(t.amount));
    setEditDescription(t.description ?? "");
    setEditDate(t.transactionDate.slice(0, 10));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editType,
        amount: Number(editAmount),
        description: editDescription,
        transactionDate: editDate,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      fetchTransactions();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>Transaksi Keuangan</h1>

        {/* Ringkasan */}
        <div style={s.summaryRow}>
          <div style={{ ...s.summaryCard, borderColor: "#2e7d5b" }}>
            <span style={s.summaryLabel}>Pemasukan</span>
            <span style={{ ...s.summaryAmount, color: "#4ade80" }}>
              Rp{totalIncome.toLocaleString("id-ID")}
            </span>
          </div>

          <div style={{ ...s.summaryCard, borderColor: "#a33" }}>
            <span style={s.summaryLabel}>Pengeluaran</span>
            <span style={{ ...s.summaryAmount, color: "#f87171" }}>
              Rp{totalExpense.toLocaleString("id-ID")}
            </span>
          </div>

          <div style={{ ...s.summaryCard, borderColor: "#3b5" }}>
            <span style={s.summaryLabel}>Saldo</span>
            <span style={s.summaryAmount}>
              Rp{(totalIncome - totalExpense).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Form tambah transaksi */}
        <form onSubmit={handleCreate} style={s.card}>
          <h2 style={s.cardTitle}>Tambah Transaksi</h2>

          <div style={s.formRow}>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "income" | "expense")
              }
              style={s.select}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>

            <input
              type="number"
              placeholder="Nominal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={s.input}
              required
            />

            <input
              type="text"
              placeholder="Deskripsi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...s.input, flex: 2 }}
            />

            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              style={s.input}
              required
            />

            <button type="submit" style={s.primaryButton}>
              Tambah
            </button>
          </div>
        </form>

        {/* Filter */}
        <div style={s.filterRow}>
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...s.filterButton,
                ...(filter === f ? s.filterButtonActive : {}),
              }}
            >
              {f === "all"
                ? "Semua"
                : f === "income"
                ? "Pemasukan"
                : "Pengeluaran"}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <p style={s.emptyText}>Memuat...</p>
        ) : transactions.length === 0 ? (
          <p style={s.emptyText}>Belum ada transaksi.</p>
        ) : (
          <div style={s.list}>
            {transactions.map((t) =>
              editingId === t.id ? (
                <div key={t.id} style={{ ...s.card, ...s.editCard }}>
                  <div style={s.formRow}>
                    <select
                      value={editType}
                      onChange={(e) =>
                        setEditType(e.target.value as "income" | "expense")
                      }
                      style={s.select}
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                    </select>

                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      style={s.input}
                    />

                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      style={{ ...s.input, flex: 2 }}
                    />

                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      style={s.input}
                    />

                    <button
                      onClick={() => handleUpdate(t.id)}
                      style={s.primaryButton}
                    >
                      Simpan
                    </button>

                    <button
                      onClick={cancelEdit}
                      style={s.secondaryButton}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div key={t.id} style={s.row}>
                  <span
                    style={{
                      ...s.badge,
                      backgroundColor:
                        t.type === "income" ? "#14532d" : "#5b1a1a",
                      color:
                        t.type === "income" ? "#4ade80" : "#f87171",
                    }}
                  >
                    {t.type === "income" ? "Masuk" : "Keluar"}
                  </span>

                  <span style={s.rowDate}>
                    {new Date(t.transactionDate).toLocaleDateString("id-ID")}
                  </span>

                  <span style={s.rowDesc}>{t.description}</span>

                  <span
                    style={{
                      ...s.rowAmount,
                      color:
                        t.type === "income" ? "#4ade80" : "#f87171",
                    }}
                  >
                    {t.type === "income" ? "+" : "-"}Rp
                    {Number(t.amount).toLocaleString("id-ID")}
                  </span>

                  <div style={s.rowActions}>
                    <button
                      onClick={() => startEdit(t)}
                      style={s.iconButton}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(t.id)}
                      style={s.iconButtonDanger}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f0f10",
    color: "#e5e5e5",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "32px 16px",
  },

  container: {
    maxWidth: 720,
    margin: "0 auto",
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: 20,
  },

  summaryRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#18181b",
    border: "1px solid #2a2a2e",
    borderLeft: "3px solid",
    borderRadius: 10,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#a1a1aa",
  },

  summaryAmount: {
    fontSize: 18,
    fontWeight: 700,
  },

  card: {
    backgroundColor: "#18181b",
    border: "1px solid #2a2a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  editCard: {
    border: "1px solid #3b82f6",
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    color: "#a1a1aa",
  },

  formRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  input: {
    flex: 1,
    minWidth: 100,
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #2a2a2e",
    backgroundColor: "#0f0f10",
    color: "#e5e5e5",
    fontSize: 14,
    outline: "none",
  },

  select: {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #2a2a2e",
    backgroundColor: "#0f0f10",
    color: "#e5e5e5",
    fontSize: 14,
  },

  primaryButton: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#3b82f6",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "1px solid #2a2a2e",
    backgroundColor: "transparent",
    color: "#a1a1aa",
    fontSize: 14,
    cursor: "pointer",
  },

  filterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },

  filterButton: {
    padding: "7px 14px",
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#2a2a2e",
    backgroundColor: "transparent",
    color: "#a1a1aa",
    fontSize: 13,
    cursor: "pointer",
  },

  filterButtonActive: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    borderColor: "#3b82f6",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#18181b",
    border: "1px solid #2a2a2e",
    borderRadius: 10,
    padding: "12px 14px",
  },

  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 6,
    flexShrink: 0,
  },

  rowDate: {
    fontSize: 13,
    color: "#a1a1aa",
    flexShrink: 0,
    minWidth: 70,
  },

  rowDesc: {
    fontSize: 14,
    flex: 1,
  },

  rowAmount: {
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },

  rowActions: {
    display: "flex",
    gap: 6,
    flexShrink: 0,
  },

  iconButton: {
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid #2a2a2e",
    backgroundColor: "transparent",
    color: "#a1a1aa",
    fontSize: 12,
    cursor: "pointer",
  },

  iconButtonDanger: {
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid #5b1a1a",
    backgroundColor: "transparent",
    color: "#f87171",
    fontSize: 12,
    cursor: "pointer",
  },

  emptyText: {
    color: "#71717a",
    textAlign: "center",
    padding: "32px 0",
  },
};
