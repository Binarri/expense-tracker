// SRS-009 — Monthly Budget & Budget Indicator
// Programmer: Annis Fakhiroh Akbar

"use client";

import { useEffect, useState } from "react";

type BudgetStatus = "belum_diset" | "aman" | "waspada" | "melebihi";

type IndicatorData = {
  month: number;
  year: number;
  hasBudget: boolean;
  budget: number;
  totalExpense: number;
  remaining: number;
  percentage: number | null;
  status: BudgetStatus;
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const STATUS_LABEL: Record<BudgetStatus, string> = {
  belum_diset: "Belum Diset",
  aman: "Aman",
  waspada: "Waspada",
  melebihi: "Melebihi Budget",
};

const STATUS_STYLE: Record<BudgetStatus, { badge: string; bar: string }> = {
  belum_diset: { badge: "bg-gray-100 text-gray-600", bar: "bg-gray-300" },
  aman: { badge: "bg-green-100 text-green-700", bar: "bg-green-500" },
  waspada: { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
  melebihi: { badge: "bg-red-100 text-red-700", bar: "bg-red-500" },
};

const formatRupiah = (val: number) => "Rp" + val.toLocaleString("id-ID");

const now = new Date();

export default function BudgetPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadIndicator() {
      setLoading(true);
      setError(null);

      try {
        // AJAX: pindah bulan/tahun cukup fetch ulang, tanpa reload halaman.
        const res = await fetch(
          `/api/budgets/indicator?month=${month}&year=${year}`
        );

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          throw new Error("Gagal memuat data budget");
        }

        const json: IndicatorData = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setError("Gagal memuat data budget. Coba muat ulang.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadIndicator();

    return () => {
      active = false;
    };
  }, [month, year]);

  function goToCurrentMonth() {
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  }

  const statusStyle = STATUS_STYLE[data?.status ?? "belum_diset"];
  const barWidth = Math.min(data?.percentage ?? 0, 100);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Budget Bulanan</h1>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-indigo-600 hover:underline"
          >
            &larr; Dashboard
          </a>
        </div>

        {/* Pemilih bulan & tahun */}
        <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>

          <button
            onClick={goToCurrentMonth}
            className="ml-auto text-sm font-medium text-indigo-600 hover:underline"
          >
            Bulan Ini
          </button>
        </div>

        {/* Konten */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center text-gray-400 text-sm">
            Memuat data budget...
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center text-red-600 text-sm">
            {error ?? "Terjadi kesalahan."}
          </div>
        ) : (
          <>
            {/* Ringkasan */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Budget</p>
                <p className="text-indigo-600 font-bold text-sm">
                  {formatRupiah(data.budget)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Pengeluaran</p>
                <p className="text-red-600 font-bold text-sm">
                  {formatRupiah(data.totalExpense)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Sisa Budget</p>
                <p
                  className={`font-bold text-sm ${
                    data.remaining < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatRupiah(data.remaining)}
                </p>
              </div>
            </div>

            {/* Indikator penggunaan budget */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500">
                  Penggunaan Budget — {MONTH_NAMES[month - 1]} {year}
                </h2>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyle.badge}`}
                >
                  {STATUS_LABEL[data.status]}
                </span>
              </div>

              {data.hasBudget ? (
                <>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${statusStyle.bar}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    {data.percentage}% dari budget terpakai
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-sm py-2">
                  Kamu belum menetapkan budget untuk bulan ini.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
