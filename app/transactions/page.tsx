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
  const [budgetSummary, setBudgetSummary] = useState({
    budget: 0,
    totalExpense: 0,
    remaining: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    hasBudget: false,
  });

  const [budgetLoading, setBudgetLoading] = useState(false);
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
    fetchBudgetSummary();
  }, [filter]);

  async function fetchTransactions() {
    setLoading(true);

    const url =
      filter === "all"
        ? "/api/transactions"
        : `/api/transactions?type=${filter}`;

    const res = await fetch(url);

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    const data = await res.json();

    // API bisa balikin error object (mis. { error: "..." }) kalau gagal,
    // bukan array transaksi — jangan disimpan ke state kalau begitu.
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function fetchBudgetSummary() {
    setBudgetLoading(true);

    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();

      const res = await fetch(
        `/api/budgets/summary?month=${month}&year=${year}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil budget");
      }

      setBudgetSummary(data);
    } catch (error) {
      console.error("Gagal mengambil budget summary:", error);
    } finally {
      setBudgetLoading(false);
    }
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

      await fetchTransactions();
      await fetchBudgetSummary();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;

    const res = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await fetchTransactions();
      await fetchBudgetSummary();
    }
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

      await fetchTransactions();
      await fetchBudgetSummary();
    }
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const filterLabel = { all: "Semua", income: "Pemasukan", expense: "Pengeluaran" };

  return (

    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Transaksi Keuangan
          </h1>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            &larr; Dashboard
          </a>
        </div>
        {/* Budget Summary */}
        <div style={s.budgetCard}>
          <div style={s.budgetHeader}>
            <div>
              <span style={s.summaryLabel}>Budget Bulan Ini</span>
              <h2 style={s.budgetTitle}>
                {budgetSummary.month}/{budgetSummary.year}
              </h2>
            </div>

            {budgetSummary.hasBudget && (
              <span style={s.budgetStatus}>
                Aktif
              </span>
            )}
          </div>

          {budgetLoading ? (
            <p style={s.emptyText}>Memuat budget...</p>
          ) : !budgetSummary.hasBudget ? (
            <p style={s.emptyText}>
              Belum ada budget untuk bulan ini.
            </p>
          ) : (
            <div style={s.budgetGrid}>
              <div>
                <span style={s.summaryLabel}>Anggaran</span>
                <strong style={s.budgetAmount}>
                  Rp{budgetSummary.budget.toLocaleString("id-ID")}
                </strong>
              </div>

              <div>
                <span style={s.summaryLabel}>Pengeluaran</span>
                <strong style={{ ...s.budgetAmount, color: "#f87171" }}>
                  Rp{budgetSummary.totalExpense.toLocaleString("id-ID")}
                </strong>
              </div>

              <div>
                <span style={s.summaryLabel}>Sisa Anggaran</span>
                <strong
                  style={{
                    ...s.budgetAmount,
                    color:
                      budgetSummary.remaining >= 0
                        ? "#4ade80"
                        : "#f87171",
                  }}
                >
                  Rp{budgetSummary.remaining.toLocaleString("id-ID")}
                </strong>
              </div>
            </div>
          )}
        </div>

    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>Transaksi Keuangan</h1>
        

        {/* Ringkasan */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 border-l-4 border-green-500">
            <p className="text-gray-500 text-xs mb-1">Pemasukan</p>
            <p className="text-green-600 font-bold text-sm">
              Rp{totalIncome.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4 border-l-4 border-red-500">
            <p className="text-gray-500 text-xs mb-1">Pengeluaran</p>
            <p className="text-red-600 font-bold text-sm">
              Rp{totalExpense.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4 border-l-4 border-indigo-500">
            <p className="text-gray-500 text-xs mb-1">Saldo</p>
            <p className="text-indigo-600 font-bold text-sm">
              Rp{(totalIncome - totalExpense).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Form tambah transaksi */}
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            Tambah Transaksi
          </h2>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>

            <input
              type="number"
              placeholder="Nominal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 min-w-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              required
            />

            <input
              type="text"
              placeholder="Deskripsi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-[2] min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />

            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              required
            />

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
            >
              Tambah
            </button>
          </div>
        </form>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                filter === f
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filterLabel[f]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Memuat...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              Belum ada transaksi.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {transactions.map((t) =>
                editingId === t.id ? (
                  <li key={t.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap gap-2 items-center bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <select
                        value={editType}
                        onChange={(e) =>
                          setEditType(e.target.value as "income" | "expense")
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      >
                        <option value="expense">Pengeluaran</option>
                        <option value="income">Pemasukan</option>
                      </select>

                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="flex-1 min-w-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      />

                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="flex-[2] min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      />

                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      />

                      <button
                        onClick={() => handleUpdate(t.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
                      >
                        Simpan
                      </button>

                      <button
                        onClick={cancelEdit}
                        className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        Batal
                      </button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                        t.type === "income"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.type === "income" ? "Masuk" : "Keluar"}
                    </span>

                    <span className="text-gray-400 text-xs shrink-0 min-w-[70px]">
                      {new Date(t.transactionDate).toLocaleDateString("id-ID")}
                    </span>

                    <span className="text-gray-900 text-sm flex-1 min-w-[100px]">
                      {t.description}
                    </span>

                    <span
                      className={`font-bold text-sm shrink-0 ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}Rp
                      {Number(t.amount).toLocaleString("id-ID")}
                    </span>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(t)}
                        className="text-xs border border-gray-300 text-gray-600 px-2.5 py-1 rounded-md hover:bg-gray-50 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-xs border border-red-200 text-red-600 px-2.5 py-1 rounded-md hover:bg-red-50 transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
