
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API_URL =
  "https://smart-stock-ai-backend.vercel.app/api/products";
const SALES_API =
  "https://smart-stock-ai-backend.vercel.app/api/sales";

function getStoredValue(key) {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

export default function Dashboard() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    const savedUser = getStoredValue("user");

    if (!savedUser) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      router.replace("/login");
    }
  }, [router]);

  const loadDashboardData = useCallback(async () => {
    const token = getStoredValue("token");

    if (!token) {
      setDataError("Login token not found. Please log in again.");
      setProductsLoading(false);
      return;
    }

    try {
      setDataError("");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [productsResponse, salesResponse] = await Promise.all([
        fetch(API_URL, { headers }),
        fetch(SALES_API, { headers }),
      ]);

      if (
        [401, 403].includes(productsResponse.status) ||
        [401, 403].includes(salesResponse.status)
      ) {
        setDataError(
          "Authentication failed. Please log in again and check backend authorization."
        );
        setProductsLoading(false);
        return;
      }

      if (!productsResponse.ok) {
        throw new Error(
          `Products request failed: ${productsResponse.status}`
        );
      }

      if (!salesResponse.ok) {
        throw new Error(
          `Sales request failed: ${salesResponse.status}`
        );
      }

      const productsData = await productsResponse.json();
      const salesData = await salesResponse.json();

      setProducts(
        Array.isArray(productsData) ? productsData : []
      );

      setSales(
        Array.isArray(salesData) ? salesData : []
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);

      setDataError(
        "Unable to load dashboard data. Please check the backend and database."
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const refreshInterval = setInterval(
      loadDashboardData,
      10000
    );

    return () => clearInterval(refreshInterval);
  }, [loadDashboardData]);

  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock || 0) <=
      Number(product.minimumStock || 0)
  );

  const lowStockCount = lowStockProducts.length;

  const outOfStockCount = products.filter(
    (product) => Number(product.stock || 0) === 0
  ).length;

  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.stock || 0),
    0
  );

  const totalSales = sales.reduce(
    (total, sale) =>
      total + Number(sale.totalAmount || 0),
    0
  );

  const totalItemsSold = sales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  );

  const today = new Date();

  const todaySales = sales.filter((sale) => {
    if (!sale.createdAt) return false;

    const saleDate = new Date(sale.createdAt);

    return (
      saleDate.getFullYear() === today.getFullYear() &&
      saleDate.getMonth() === today.getMonth() &&
      saleDate.getDate() === today.getDate()
    );
  });

  const todaySalesAmount = todaySales.reduce(
    (total, sale) =>
      total + Number(sale.totalAmount || 0),
    0
  );

  const todayItemsSold = todaySales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  );

  const stats = [
    {
      title: "Total Products",
      value: productsLoading ? "..." : totalProducts,
      change: "Products in inventory",
      icon: "📦",
    },
    {
      title: "Today's Sales",
      value: productsLoading
        ? "..."
        : `Rs. ${todaySalesAmount.toLocaleString()}`,
      change: `${todayItemsSold} items sold today`,
      icon: "💰",
    },
    {
      title: "Low Stock Items",
      value: productsLoading ? "..." : lowStockCount,
      change:
        lowStockCount > 0
          ? "Needs attention"
          : "Stock levels are healthy",
      icon: "⚠️",
    },
    {
      title: "Total Stock",
      value: productsLoading
        ? "..."
        : totalStock.toLocaleString(),
      change: "Units available",
      icon: "📊",
    },
  ];

  const salesData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySales = sales.filter((sale) => {
      if (!sale.createdAt) return false;

      const saleDate = new Date(sale.createdAt);

      return saleDate >= date && saleDate < nextDate;
    });

    const amount = daySales.reduce(
      (total, sale) =>
        total + Number(sale.totalAmount || 0),
      0
    );

    salesData.push({
      day: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      amount,
    });
  }

  const maxSales = Math.max(
    ...salesData.map((item) => item.amount),
    1
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    router.replace("/login");
  };

  const goTo = (path) => {
    setSidebarOpen(false);
    router.push(path);
  };

  const openExternalSite = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Quick Actions: existing actions + PickMe + Uber
  const quickActions = [
    {
      title: "Add Product",
      description: "Add inventory item",
      path: "/inventory",
      icon: "➕",
    },
    {
      title: "Scan Product",
      description: "Use camera scanner",
      path: "/scanner",
      icon: "📷",
    },
    {
      title: "New Sale",
      description: "Record a new sale",
      path: "/sales",
      icon: "🛒",
    },
    {
      title: "Generate Report",
      description: "View business reports",
      path: "/reports",
      icon: "📊",
    },
    {
      title: "PickMe",
      description: "Open PickMe website",
      path: "https://pickme.lk/",
      image:
        "https://www.google.com/s2/favicons?domain=pickme.lk&sz=128",
      fallback: "P",
      logoBg: "bg-yellow-100",
    },
    {
      title: "Uber",
      description: "Open Uber website",
      path: "https://www.uber.com/",
      image:
        "https://www.google.com/s2/favicons?domain=uber.com&sz=128",
      fallback: "U",
      logoBg: "bg-gray-100",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-purple-100 bg-white/90 shadow-xl backdrop-blur-xl transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-purple-200 bg-white p-2 shadow-md">
            <Image
              src="/Images/logo1.jpg"
              alt="SmartStock AI Logo"
              width={120}
              height={120}
              priority
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              SmartStock <span className="text-purple-600">AI</span>
            </h1>
            <p className="text-xs text-slate-400">
              Inventory System
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <button
            onClick={() => setSidebarOpen(false)}
            className="mb-2 flex w-full items-center gap-3 rounded-xl bg-purple-100 px-4 py-3 text-left font-semibold text-purple-700"
          >
            <span className="text-lg">📊</span>
            Dashboard
          </button>

          <button
            onClick={() => {
              sessionStorage.setItem("openMainHome", "true");
              router.push("/");
              setSidebarOpen(false);
            }}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-600 transition hover:bg-purple-50 hover:text-purple-700"
          >
            <span className="text-lg">🏠</span>
            <span>Home</span>
          </button>

          {[
            ["📦", "Inventory", "/inventory"],
            ["🛒", "Sales", "/sales"],
            ["💳", "POS", "/pos"],
            ["📷", "Scanner", "/scanner"],
          ].map(([icon, label, path]) => (
            <button
              key={path}
              onClick={() => goTo(path)}
              className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-600 transition hover:bg-purple-50 hover:text-purple-700"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                {icon}
              </span>
              <span>{label}</span>
            </button>
          ))}

          <button
            onClick={() => goTo("/ai-assistant")}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-600 transition hover:bg-purple-50 hover:text-purple-700"
          >
            <Image
              src="/Images/mira2.png"
              alt="Mira"
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover"
            />
            AI Assistant
          </button>

          <div className="my-5 border-t border-slate-100" />

          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Management
          </p>

          <button
            onClick={() => goTo("/alerts")}
            className="mb-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">🔔</span>
              Alerts
            </span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              {productsLoading ? "..." : lowStockCount}
            </span>
          </button>

          {[
            ["📈", "Reports", "/reports"],
            ["⚙️", "Settings", "/settings"],
          ].map(([icon, label, path]) => (
            <button
              key={path}
              onClick={() => goTo(path)}
              className="mb-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <span className="text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-purple-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
              {user?.ownerName?.charAt(0)?.toUpperCase() || "S"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.ownerName || "Shop Owner"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || "owner@shop.com"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
              title="Logout"
              aria-label="Logout"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:ml-72">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-xl lg:hidden"
                aria-label="Open navigation"
              >
                ☰
              </button>

              <div>
                <p className="text-sm text-slate-500">
                  {today.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {today.getHours() < 12
                    ? "Good Morning!"
                    : today.getHours() < 17
                    ? "Good Afternoon!"
                    : "Good Evening!"}{" "}
                  👋
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => goTo("/alerts")}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl hover:border-purple-200 hover:bg-purple-50"
                aria-label="Notifications"
              >
                🔔
                {lowStockCount > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </button>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 font-bold text-white shadow-md">
                {user?.ownerName?.charAt(0)?.toUpperCase() || "S"}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* ERROR MESSAGE */}
          {dataError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              ⚠️ {dataError}
              <button
                onClick={loadDashboardData}
                className="ml-3 font-bold underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* WELCOME BANNER */}
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800 p-7 text-white shadow-xl shadow-purple-200">
            <div className="relative z-10 max-w-2xl">
              <p className="text-sm font-medium text-purple-200">
                SMARTSTOCK AI
              </p>

              <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Your business at a glance.
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-purple-100 sm:text-base">
                Monitor your inventory, understand your sales and let AI
                help you make smarter business decisions.
              </p>

              <button
                onClick={() => goTo("/inventory")}
                className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-purple-700 shadow-lg hover:bg-purple-50"
              >
                Manage Inventory →
              </button>
            </div>

            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 right-20 h-80 w-80 rounded-full bg-white/5" />
          </div>

          {/* STATISTICS */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-extrabold text-slate-900">
                      {stat.value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl">
                    {stat.icon}
                  </div>
                </div>

                <p className="mt-4 text-xs font-medium text-purple-600">
                  {stat.change}
                </p>
              </div>
            ))}
          </div>

          {/* TOTAL SALES AND OUT OF STOCK */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Sales
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {productsLoading
                      ? "..."
                      : `Rs. ${totalSales.toLocaleString()}`}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                  💵
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-green-600">
                {totalItemsSold} total items sold
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Out of Stock
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {productsLoading ? "..." : outOfStockCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl">
                  🚨
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-red-600">
                {outOfStockCount > 0
                  ? "Products need immediate restocking"
                  : "No products are out of stock"}
              </p>
            </div>
          </div>

          {/* SALES OVERVIEW AND AI INSIGHTS */}
          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {/* SALES OVERVIEW */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Sales Overview
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Sales performance for the last 7 days
                  </p>
                </div>

                <span className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-600">
                  Last 7 Days
                </span>
              </div>

              <div className="mt-8 flex h-64 items-end justify-between gap-3">
                {salesData.map((item, index) => {
                  const height =
                    item.amount > 0
                      ? (item.amount / maxSales) * 100
                      : 3;

                  return (
                    <div
                      key={`${item.day}-${index}`}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <div className="mb-2 text-center text-xs font-semibold text-slate-500">
                        {item.amount > 0
                          ? `Rs. ${Math.round(item.amount / 1000)}k`
                          : "Rs. 0"}
                      </div>

                      <div
                        className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-purple-700 to-purple-400 transition hover:from-purple-800 hover:to-purple-500"
                        style={{ height: `${height}%` }}
                        title={`Rs. ${item.amount.toLocaleString()}`}
                      />

                      <div className="mt-3 text-xs font-medium text-slate-500">
                        {item.day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI INSIGHTS */}
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-purple-200 bg-white p-1 shadow-md">
                  <Image
                    src="/Images/mira2.png"
                    alt="Mira AI Assistant"
                    width={56}
                    height={56}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    AI Insights
                  </h3>
                  <p className="text-xs text-slate-500">
                    SmartStock AI
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-purple-100 bg-white p-4">
                  <p className="text-sm font-bold text-slate-900">
                    💰 Sales Performance
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    You have recorded {sales.length} sales with{" "}
                    {totalItemsSold} items sold.
                  </p>
                </div>

                <div className="rounded-xl border border-purple-100 bg-white p-4">
                  <p className="text-sm font-bold text-slate-900">
                    ⚠️ Stock needs attention
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {lowStockCount} products are currently below their
                    minimum stock level.
                  </p>
                </div>

                <div className="rounded-xl border border-purple-100 bg-white p-4">
                  <p className="text-sm font-bold text-slate-900">
                    🚨 Out of Stock
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {outOfStockCount} products currently have zero stock.
                  </p>
                </div>

                <div className="rounded-xl border border-purple-100 bg-white p-4">
                  <p className="text-sm font-bold text-slate-900">
                    💡 AI Recommendation
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {outOfStockCount > 0
                      ? "Restock out-of-stock products immediately."
                      : lowStockCount > 0
                      ? "Consider restocking products below minimum stock."
                      : "Your current inventory levels look healthy."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => goTo("/ai-assistant")}
                className="mt-5 w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-700"
              >
                Ask AI Assistant →
              </button>
            </div>
          </div>

          {/* LOW STOCK ALERTS AND QUICK ACTIONS */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* LOW STOCK ALERTS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Low Stock Alerts
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Products that need restocking
                  </p>
                </div>

                <button
                  onClick={() => goTo("/inventory")}
                  className="text-sm font-bold text-purple-600 hover:text-purple-800"
                >
                  View All
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {productsLoading ? (
                  <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                    Loading stock information...
                  </div>
                ) : lowStockProducts.length === 0 ? (
                  <div className="rounded-xl bg-green-50 p-5 text-center">
                    <p className="font-semibold text-green-700">
                      ✓ All products are sufficiently stocked.
                    </p>
                  </div>
                ) : (
                  lowStockProducts.slice(0, 4).map((product, index) => (
                    <div
                      key={product._id || product.id || index}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          SKU: {product.sku || "N/A"}
                        </p>
                      </div>

                      <div className="ml-4 text-right">
                        <p className="text-sm font-bold text-red-600">
                          {product.stock} units
                        </p>
                        <p className="text-xs text-slate-400">
                          Min: {product.minimumStock}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Quickly access common tasks and transport services
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const isExternal = action.path.startsWith("http");

                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={() =>
                        isExternal
                          ? openExternalSite(action.path)
                          : goTo(action.path)
                      }
                      className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-purple-300 hover:bg-purple-50"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                          action.logoBg || "bg-purple-100"
                        } p-1 text-lg`}
                      >
                        {action.image ? (
                          <img
                            src={action.image}
                            alt={`${action.title} logo`}
                            width={40}
                            height={40}
                            loading="lazy"
                            className="h-full w-full object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              const fallback =
                                event.currentTarget.nextElementSibling;
                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}

                        {action.image ? (
                          <span
                            className="hidden h-full w-full items-center justify-center font-extrabold text-slate-800"
                            aria-hidden="true"
                          >
                            {action.fallback}
                          </span>
                        ) : (
                          <span>{action.icon}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {action.description}
                        </p>
                      </div>

                      {isExternal && (
                        <span
                          className="ml-auto shrink-0 text-xs text-slate-400"
                          aria-label="Opens in new tab"
                        >
                          ↗
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
