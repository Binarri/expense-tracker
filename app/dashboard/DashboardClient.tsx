"use client";

import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

type RecentTransaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  transactionDate: string;
};

type DashboardData = {
  name: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  recentTransactions: RecentTransaction[];
};

const formatRupiah = (val: number) => "Rp" + val.toLocaleString("id-ID");

const today = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        // AJAX: ambil data dashboard dari server tanpa reload halaman
        const res = await fetch("/api/dashboard");

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          throw new Error("Gagal memuat data dashboard");
        }

        const json: DashboardData = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setError("Gagal memuat data dashboard. Coba muat ulang.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <p className="text-gray-500 text-sm">Memuat dashboard...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-red-600 text-sm">{error ?? "Terjadi kesalahan."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Halo, {data.name} 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{today}</p>
          </div>

          <LogoutButton />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Pemasukan */}
          <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-between min-h-[104px]">
            <span className="text-green-600 text-xl">↑</span>
            <div>
              <p className="text-gray-500 text-xs mb-1">Pemasukan</p>
              <p className="text-green-600 font-bold text-sm leading-tight">
                {formatRupiah(data.totalIncome)}
              </p>
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-between min-h-[104px]">
            <span className="text-red-600 text-xl">↓</span>
            <div>
              <p className="text-gray-500 text-xs mb-1">Pengeluaran</p>
              <p className="text-red-600 font-bold text-sm leading-tight">
                {formatRupiah(data.totalExpense)}
              </p>
            </div>
          </div>

          {/* Saldo */}
          <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col justify-between min-h-[104px]">
            <span className="text-indigo-600 text-xl">💼</span>
            <div>
              <p className="text-gray-500 text-xs mb-1">Saldo</p>
              <p className="text-indigo-600 font-bold text-sm leading-tight">
                {formatRupiah(data.balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Tombol transaksi */}
        <a
          href="/transactions"
          className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
        >
          + Tambah / Kelola Transaksi
        </a>

        {/* Transaksi Terbaru */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Transaksi Terbaru
          </h2>

          {data.recentTransactions.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">Belum ada transaksi.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentTransactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  {/* Kiri: dot + info */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        tx.type === "income" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <p className="text-gray-900 font-medium text-sm">
                        {tx.description}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(tx.transactionDate).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Kanan: nominal + type */}
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${
                        tx.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </p>
                    <p className="text-gray-400 text-xs capitalize">
                      {tx.type}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
