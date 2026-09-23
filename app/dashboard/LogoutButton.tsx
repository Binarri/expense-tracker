"use client";

export default function LogoutButton() {
  async function handleLogout() {
    const response = await fetch("/api/logout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
}