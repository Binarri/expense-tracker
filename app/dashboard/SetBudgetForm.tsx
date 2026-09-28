"use client";

import { FormEvent, useState } from "react";

export default function SetBudgetForm() {
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [message, setMessage] = useState("");

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

      setMessage("Budget berhasil disimpan!");
      setAmount("");
    } catch {
      setMessage("Terjadi kesalahan. Coba lagi.");
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
            htmlFor="budget"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Budget
          </label>

          <input
            id="budget"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Contoh: 1500000"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

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

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Simpan Budget
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