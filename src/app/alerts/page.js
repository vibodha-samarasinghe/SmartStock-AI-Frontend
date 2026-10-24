
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://smart-stock-ai-backend.vercel.app/api/products";

export default function AlertsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load products (${response.status})`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid products response.");
      }

      setProducts(data);
    } catch (err) {
      console.error("Alerts loading error:", err);
      setError(
        "Cannot load stock alerts. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const outOfStock = products.filter(
    (product) => Number(product.stock || 0) === 0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock || 0) > 0 &&
      Number(product.stock || 0) <=
        Number(product.minimumStock || 0)
  );

  const healthyStock = products.filter(
    (product) =>
      Number(product.stock || 0) >
      Number(product.minimumStock || 0)
  );

  return (
    <main className="min-h-screen bg-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="font-semibold text-purple-600">
            SMARTSTOCK AI
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Alerts 🔔
          </h1>
          <p className="mt-2 text-slate-500">
            Monitor products that need your attention.
          </p>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border-l-4 border-red-500 bg-white p-6 shadow">
            <p className="text-sm font-semibold text-slate-500">
              Out of Stock
            </p>
            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {loading ? "..." : outOfStock.length}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Products with zero stock
            </p>
          </div>

          <div className="rounded-2xl border-l-4 border-yellow-500 bg-white p-6 shadow">
            <p className="text-sm font-semibold text-slate-500">
              Low Stock
            </p>
            <h2 className="mt-2 text-3xl font-bold text-yellow-600">
              {loading ? "..." : lowStock.length}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Products at minimum stock level
            </p>
          </div>

          <div className="rounded-2xl border-l-4 border-green-500 bg-white p-6 shadow">
            <p className="text-sm font-semibold text-slate-500">
              Healthy Stock
            </p>
            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {loading ? "..." : healthyStock.length}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Products with sufficient stock
            </p>
          </div>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow md:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Stock Alerts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Products that require attention.
              </p>
            </div>

            <button
              onClick={loadProducts}
              disabled={loading}
              className="rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200 disabled:opacity-50"
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
              Loading alerts...
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
              <p>{error}</p>
              <button
                onClick={loadProducts}
                className="mt-3 rounded-lg bg-red-100 px-4 py-2 font-semibold hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          ) : outOfStock.length === 0 &&
            lowStock.length === 0 ? (
            <div className="rounded-2xl bg-green-50 p-10 text-center">
              <div className="text-5xl">✅</div>
              <h3 className="mt-4 text-xl font-bold text-green-700">
                All Stock Levels Are Healthy
              </h3>
              <p className="mt-2 text-sm text-green-600">
                There are no products that require immediate attention.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {[...outOfStock, ...lowStock].map((product) => {
                const isOut = Number(product.stock || 0) === 0;

                return (
                  <div
                    key={product._id}
                    className={`flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between ${
                      isOut
                        ? "border-red-200 bg-red-50"
                        : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {isOut ? "🚨" : "⚠️"}
                        </span>
                        <h3 className="font-bold text-slate-900">
                          {product.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        SKU: {product.sku}
                      </p>
                      <p className="text-sm text-slate-500">
                        Category: {product.category}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          isOut
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isOut ? "OUT OF STOCK" : "LOW STOCK"}
                      </span>
                      <p className="mt-3 text-sm text-slate-500">
                        Current Stock:{" "}
                        <span className="font-bold">
                          {Number(product.stock || 0)}
                        </span>
                      </p>
                      <p className="text-sm text-slate-500">
                        Minimum Stock: {product.minimumStock ?? 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
