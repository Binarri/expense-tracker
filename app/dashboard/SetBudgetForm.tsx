"use client";

import { FormEvent, useEffect, useState } from "react";

export default function SetBudgetForm() {
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingBudget, setExistingBudget] = useState(false);

  // Ambil budget ketika bulan dipilih
  useEffect(() => {
    if (!month) {
      setAmount("");
      setExistingBudget(false);
      setMessage("");
      return;
    }

    async function loadBudget() {
      setMessage("");

      const [year, selectedMonth] = month.split("-");

      try {
        const response = await fetch(
          `/api/budgets?month=${selectedMonth}&year=${year}`
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Gagal mengambil budget.");
          return;
        }

        if (data.budget) {
          setAmount(String(data.budget.amount));
          setExistingBudget(true);
        } else {
          setAmount("");
          setExistingBudget(false);
        }
      } catch {
        setMessage("Gagal mengambil budget.");
      }
    }

    loadBudget();
  }, [month]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!amount || !month) {
      setMessage("Budget dan bulan wajib diisi.");
      return;
    }

    if (Number(amount) <= 0) {
      setMessage("Budget harus lebih dari 0.");
      return;
    }

    const [year, selectedMonth] = month.split("-");

    setLoading(true);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          month: Number(selectedMonth),
          year: Number(year),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Gagal menyimpan budget.");
        return;
      }

      setAmount(String(data.budget.amount));
      setExistingBudget(true);
      setMessage("Budget berhasil disimpan.");
    } catch {
      setMessage("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Set Budget
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="month"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Bulan
          </label>

          <input
            id="month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {existingBudget && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
            <p className="text-sm text-gray-600">
              Budget tersimpan untuk bulan ini:
            </p>

            <p className="text-xl font-bold text-indigo-600 mt-1">
              Rp{Number(amount).toLocaleString("id-ID")}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="budget"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {existingBudget ? "Ubah Budget" : "Budget"}
          </label>

          <input
            id="budget"
            type="number"
            min="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Contoh: 1500000"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading
            ? "Menyimpan..."
            : existingBudget
              ? "Simpan Perubahan"
              : "Simpan Budget"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}