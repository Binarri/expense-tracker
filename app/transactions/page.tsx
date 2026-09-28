"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  transactionDate: string;
};

type BudgetSummary = {
  budget: number;
  totalExpense: number;
  remaining: number;
  month: number;
  year: number;
  hasBudget: boolean;
};

export default function TransactionsPage() {
  // =========================
  // TRANSACTION STATE
  // =========================
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] =
    useState<"all" | "income" | "expense">("all");
  const [loading, setLoading] = useState(false);

  // =========================
  // BUDGET SUMMARY STATE
  // =========================
  const [budgetSummary, setBudgetSummary] =
    useState<BudgetSummary>({
      budget: 0,
      totalExpense: 0,
      remaining: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      hasBudget: false,
    });

  const [budgetLoading, setBudgetLoading] = useState(false);

  // =========================
  // CREATE TRANSACTION STATE
  // =========================
  const [type, setType] =
    useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");

  // =========================
  // EDIT TRANSACTION STATE
  // =========================
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [editType, setEditType] =
    useState<"income" | "expense">("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    fetchTransactions();
    fetchBudgetSummary();

    // Fungsi fetch sengaja dipanggil saat filter berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // =========================
  // AJAX: GET TRANSACTIONS
  // =========================
  async function fetchTransactions() {
    setLoading(true);

    try {
      const url =
        filter === "all"
          ? "/api/transactions"
          : `/api/transactions?type=${filter}`;

      const res = await fetch(url, {
        cache: "no-store",
      });

      // Kalau session sudah tidak valid,
      // arahkan kembali ke login.
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      // API seharusnya mengembalikan array transaksi.
      // Kalau API mengembalikan error object, jangan masukkan
      // object tersebut ke state transactions.
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal mengambil transaksi:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // AJAX: GET BUDGET SUMMARY
  // =========================
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

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Gagal mengambil budget"
        );
      }

      setBudgetSummary(data);
    } catch (error) {
      console.error(
        "Gagal mengambil budget summary:",
        error
      );
    } finally {
      setBudgetLoading(false);
    }
  }

  // =========================
  // AJAX: CREATE TRANSACTION
  // =========================
  async function handleCreate(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

      // Update transaksi dan budget tanpa reload halaman.
      await fetchTransactions();
      await fetchBudgetSummary();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menambahkan transaksi");
    }
  }

  // =========================
  // AJAX: DELETE TRANSACTION
  // =========================
  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) {
      return;
    }

    const res = await fetch(
      `/api/transactions/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      // Update transaksi dan budget tanpa reload.
      await fetchTransactions();
      await fetchBudgetSummary();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal menghapus transaksi");
    }
  }

  // =========================
  // START EDIT
  // =========================
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

  // =========================
  // AJAX: UPDATE TRANSACTION
  // =========================
  async function handleUpdate(id: string) {
    const res = await fetch(
      `/api/transactions/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: editType,
          amount: Number(editAmount),
          description: editDescription,
          transactionDate: editDate,
        }),
      }
    );

    if (res.ok) {
      setEditingId(null);

      // Update transaksi dan budget tanpa reload.
      await fetchTransactions();
      await fetchBudgetSummary();
    } else {
      const data = await res.json();
      alert(data.error || "Gagal mengubah transaksi");
    }
  }

  // =========================
  // CALCULATE TRANSACTION TOTAL
  // =========================
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

  const filterLabel = {
    all: "Semua",
    income: "Pemasukan",
    expense: "Pengeluaran",
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
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

        {/* ========================================
            SRS-008: BUDGET SUMMARY
        ======================================== */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">
                Budget Bulan Ini
              </p>

              <h2 className="text-xl font-bold text-gray-900">
                {budgetSummary.month}/{budgetSummary.year}
              </h2>
            </div>

            {budgetSummary.hasBudget && (
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                Aktif
              </span>
            )}
          </div>

          {budgetLoading ? (
            <p className="text-center text-gray-400 py-4 text-sm">
              Memuat budget...
            </p>
          ) : !budgetSummary.hasBudget ? (
            <p className="text-gray-400 text-sm">
              Belum ada budget untuk bulan ini.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {/* BUDGET */}
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  Anggaran
                </p>

                <p className="text-indigo-600 font-bold text-sm">
                  Rp
                  {budgetSummary.budget.toLocaleString(
                    "id-ID"
                  )}
                </p>
              </div>

              {/* TOTAL EXPENSE */}
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  Pengeluaran
                </p>

                <p className="text-red-600 font-bold text-sm">
                  Rp
                  {budgetSummary.totalExpense.toLocaleString(
                    "id-ID"
                  )}
                </p>
              </div>

              {/* REMAINING */}
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  Sisa Anggaran
                </p>

                <p
                  className={`font-bold text-sm ${
                    budgetSummary.remaining >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  Rp
                  {budgetSummary.remaining.toLocaleString(
                    "id-ID"
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================
            TRANSACTION SUMMARY
        ======================================== */}
        <div className="grid grid-cols-3 gap-4">

          {/* INCOME */}
          <div className="bg-white rounded-2xl shadow-xl p-4 border-l-4 border-green-500">
            <p className="text-gray-500 text-xs mb-1">
              Pemasukan
            </p>

            <p className="text-green-600 font-bold text-sm">
              Rp
              {totalIncome.toLocaleString("id-ID")}
            </p>
          </div>

          {/* EXPENSE */}
          <div className="bg-white rounded-2xl shadow-xl p-4 border-l-4 border-red-500">
            <p className="text-gray-500 text-xs mb-1">
              Pengeluaran
            </p>

            <p className="text-red-600 font-bold text-sm">
              Rp
              {totalExpense.toLocaleString("id-ID")}
            </p>
          </div>

          {/* BALANCE */}
          <div className="bg-white rounded-2xl shadow-xl p-4 border-l-4 border-indigo-500">
            <p className="text-gray-500 text-xs mb-1">
              Saldo
            </p>

            <p className="text-indigo-600 font-bold text-sm">
              Rp
              {(totalIncome - totalExpense).toLocaleString(
                "id-ID"
              )}
            </p>
          </div>
        </div>

        {/* ========================================
            CREATE TRANSACTION
        ======================================== */}
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            Tambah Transaksi
          </h2>

          <div className="flex flex-wrap gap-2 items-center">

            {/* TYPE */}
            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as
                    | "income"
                    | "expense"
                )
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="expense">
                Pengeluaran
              </option>

              <option value="income">
                Pemasukan
              </option>
            </select>

            {/* AMOUNT */}
            <input
              type="number"
              placeholder="Nominal"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              className="flex-1 min-w-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              required
            />

            {/* DESCRIPTION */}
            <input
              type="text"
              placeholder="Deskripsi"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="flex-[2] min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />

            {/* DATE */}
            <input
              type="date"
              value={transactionDate}
              onChange={(e) =>
                setTransactionDate(e.target.value)
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              required
            />

            {/* SUBMIT */}
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
            >
              Tambah
            </button>
          </div>
        </form>

        {/* ========================================
            FILTER
        ======================================== */}
        <div className="flex gap-2">
          {(
            ["all", "income", "expense"] as const
          ).map((f) => (
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

        {/* ========================================
            TRANSACTION LIST
        ======================================== */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              Memuat...
            </p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              Belum ada transaksi.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {transactions.map((t) =>
                editingId === t.id ? (
                  /* ==============================
                     EDIT MODE
                  ============================== */
                  <li
                    key={t.id}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap gap-2 items-center bg-indigo-50 border border-indigo-200 rounded-lg p-3">

                      {/* EDIT TYPE */}
                      <select
                        value={editType}
                        onChange={(e) =>
                          setEditType(
                            e.target.value as
                              | "income"
                              | "expense"
                          )
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      >
                        <option value="expense">
                          Pengeluaran
                        </option>

                        <option value="income">
                          Pemasukan
                        </option>
                      </select>

                      {/* EDIT AMOUNT */}
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) =>
                          setEditAmount(e.target.value)
                        }
                        className="flex-1 min-w-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      />

                      {/* EDIT DESCRIPTION */}
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) =>
                          setEditDescription(e.target.value)
                        }
                        className="flex-[2] min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      />

                      {/* EDIT DATE */}
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) =>
                          setEditDate(e.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500"
                      />

                      {/* SAVE */}
                      <button
                        onClick={() =>
                          handleUpdate(t.id)
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
                      >
                        Simpan
                      </button>

                      {/* CANCEL */}
                      <button
                        onClick={cancelEdit}
                        className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        Batal
                      </button>
                    </div>
                  </li>
                ) : (
                  /* ==============================
                     NORMAL MODE
                  ============================== */
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {/* TYPE BADGE */}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                        t.type === "income"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.type === "income"
                        ? "Masuk"
                        : "Keluar"}
                    </span>

                    {/* DATE */}
                    <span className="text-gray-400 text-xs shrink-0 min-w-[70px]">
                      {new Date(
                        t.transactionDate
                      ).toLocaleDateString("id-ID")}
                    </span>

                    {/* DESCRIPTION */}
                    <span className="text-gray-900 text-sm flex-1 min-w-[100px]">
                      {t.description}
                    </span>

                    {/* AMOUNT */}
                    <span
                      className={`font-bold text-sm shrink-0 ${
                        t.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}Rp
                      {Number(t.amount).toLocaleString(
                        "id-ID"
                      )}
                    </span>

                    {/* ACTIONS */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() =>
                          startEdit(t)
                        }
                        className="text-xs border border-gray-300 text-gray-600 px-2.5 py-1 rounded-md hover:bg-gray-50 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(t.id)
                        }
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