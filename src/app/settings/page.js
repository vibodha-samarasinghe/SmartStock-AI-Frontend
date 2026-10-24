
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load logged-in user
  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!storedUser || !token) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error("Invalid user data:", error);

      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Logout
  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    setUser(null);
    router.replace("/login");
  };

  // Loading UI
  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6 md:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="glass rounded-2xl p-8 text-center text-slate-500">
            Loading profile...
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // Settings UI
  return (
    <main className="min-h-screen bg-white p-6 md:p-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <p className="font-semibold text-purple-600">
            SMARTSTOCK AI
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Settings ⚙️
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your SmartStock AI profile and account.
          </p>
        </div>

        {/* Profile */}
        <section className="glass rounded-3xl p-6 md:p-8">

          {/* Profile Header */}
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-600 text-3xl font-bold text-white">
              {user.ownerName
                ? user.ownerName.charAt(0).toUpperCase()
                : "U"}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {user.ownerName || "Shop Owner"}
              </h2>

              <p className="mt-1 text-slate-500">
                {user.email || "Email not available"}
              </p>

              <span className="mt-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                Shop Owner
              </span>
            </div>

          </div>

          {/* Account Information */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-slate-900">
              Account Information
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              <InfoCard
                label="Owner Name"
                value={user.ownerName}
                icon="👤"
              />

              <InfoCard
                label="Shop Name"
                value={user.shopName}
                icon="🏪"
              />

              <InfoCard
                label="Email"
                value={user.email}
                icon="📧"
              />

              <InfoCard
                label="Phone"
                value={user.phone}
                icon="📱"
              />

              <InfoCard
                label="Address"
                value={user.address}
                icon="📍"
              />

              <InfoCard
                label="City"
                value={user.city}
                icon="🏙️"
              />

              <InfoCard
                label="Shop Category"
                value={user.category}
                icon="🏷️"
              />

            </div>
          </div>

          {/* Account Actions */}
          <div className="mt-8 border-t border-slate-200 pt-8">
            <h3 className="text-xl font-bold text-slate-900">
              Account Actions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Manage your current account session.
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 rounded-xl bg-red-100 px-6 py-3 font-semibold text-red-700 transition hover:bg-red-200"
            >
              🚪 Logout
            </button>
          </div>

        </section>
      </div>
    </main>
  );
}

// Reusable Information Card
function InfoCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center gap-3">

        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words font-semibold text-slate-900">
            {value || "Not available"}
          </p>
        </div>

      </div>
    </div>
  );
}
