"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PRODUCT_API = "http://localhost:5001/api/products";
const SALES_API = "http://localhost:5001/api/sales";

export default function ReportsPage() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  // Load Products and Sales
  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        setProducts([]);
        setSales([]);
        setError("Please log in to view reports.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [productsResponse, salesResponse] = await Promise.all([
        fetch(PRODUCT_API, { headers }),
        fetch(SALES_API, { headers }),
      ]);

      if (!productsResponse.ok || !salesResponse.ok) {
        if (
          productsResponse.status === 401 ||
          salesResponse.status === 401
        ) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");

          setProducts([]);
          setSales([]);
          setError(
            "Your session may have expired. Please log in again."
          );
          return;
        }

        throw new Error(
          `Failed to load reports. Products: ${productsResponse.status}, Sales: ${salesResponse.status}`
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
    } catch (err) {
      console.error("Reports loading error:", err);

      setProducts([]);
      setSales([]);

      setError(
        err.message || "Cannot connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Product Calculations
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.stock || 0),
    0
  );

  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stock || 0);
    const minimumStock = Number(product.minimumStock || 0);

    return stock > 0 && stock <= minimumStock;
  });

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock || 0) === 0
  );

  const healthyStockCount = products.filter(
    (product) =>
      Number(product.stock || 0) >
      Number(product.minimumStock || 0)
  ).length;

  // Sales Date Filter
  const filteredSales = useMemo(() => {
    if (filter === "all") {
      return sales;
    }

    const now = new Date();

    return sales.filter((sale) => {
      if (!sale.createdAt) return false;

      const saleDate = new Date(sale.createdAt);

      if (Number.isNaN(saleDate.getTime())) {
        return false;
      }

      if (filter === "today") {
        return (
          saleDate.getFullYear() === now.getFullYear() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getDate() === now.getDate()
        );
      }

      if (filter === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);

        const day = startOfWeek.getDay();
        const difference = day === 0 ? 6 : day - 1;

        startOfWeek.setDate(
          startOfWeek.getDate() - difference
        );

        return saleDate >= startOfWeek;
      }

      if (filter === "month") {
        return (
          saleDate.getFullYear() === now.getFullYear() &&
          saleDate.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  }, [sales, filter]);

  // Sales Calculations
  const totalSales = filteredSales.reduce(
    (total, sale) =>
      total + Number(sale.totalAmount || 0),
    0
  );

  const totalItemsSold = filteredSales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  );

  const cashSales = filteredSales
    .filter(
      (sale) =>
        String(sale.paymentMethod || "").toLowerCase() ===
        "cash"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.totalAmount || 0),
      0
    );

  const cardSales = filteredSales
    .filter(
      (sale) =>
        String(sale.paymentMethod || "").toLowerCase() ===
        "card"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.totalAmount || 0),
      0
    );

  const filterLabels = {
    all: "All Time",
    today: "Today",
    week: "This Week",
    month: "This Month",
  };

  // Download PDF Report
  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        doc.internal.pageSize.getWidth();

      const reportDate = new Date().toLocaleDateString(
        "en-GB"
      );

      const money = (value) =>
        `Rs. ${Number(value || 0).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })}`;

      // PDF Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("SMARTSTOCK AI", 14, 17);

      doc.setFontSize(16);
      doc.text("Inventory & Sales Report", 14, 27);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text(`Generated: ${reportDate}`, 14, 35);
      doc.text(
        `Sales Period: ${filterLabels[filter]}`,
        14,
        41
      );

      // Summary
      autoTable(doc, {
        startY: 48,
        head: [["Report Summary", "Value"]],
        body: [
          ["Total Products", String(totalProducts)],
          ["Total Stock Units", totalStock.toLocaleString()],
          ["Healthy Stock Products", String(healthyStockCount)],
          ["Low Stock Products", String(lowStockProducts.length)],
          [
            "Out of Stock Products",
            String(outOfStockProducts.length),
          ],
          ["Total Sales", money(totalSales)],
          ["Items Sold", String(totalItemsSold)],
          ["Cash Sales", money(cashSales)],
          ["Card Sales", money(cardSales)],
          ["Number of Sales", String(filteredSales.length)],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [109, 40, 217],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        margin: {
          left: 14,
          right: 14,
        },
        tableWidth: 120,
      });

      // Product Stock Table
      const productTableStart =
        (doc.lastAutoTable?.finalY || 48) + 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);

      doc.text(
        "Product Stock Report",
        14,
        productTableStart
      );

      autoTable(doc, {
        startY: productTableStart + 5,
        head: [[
          "Product",
          "SKU",
          "Category",
          "Price (Rs.)",
          "Stock",
          "Minimum Stock",
          "Status",
        ]],
        body: products.map((product) => {
          const stock = Number(product.stock || 0);
          const minimumStock = Number(
            product.minimumStock || 0
          );

          let status = "Healthy";

          if (stock === 0) {
            status = "Out of Stock";
          } else if (stock <= minimumStock) {
            status = "Low Stock";
          }

          return [
            product.name || "N/A",
            product.sku || "N/A",
            product.category || "N/A",
            Number(product.price || 0).toLocaleString(
              "en-US"
            ),
            String(stock),
            String(minimumStock),
            status,
          ];
        }),
        theme: "striped",
        headStyles: {
          fillColor: [109, 40, 217],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
        },
        margin: {
          left: 14,
          right: 14,
        },
      });

      // Sales Report on a New Page
      doc.addPage();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);

      doc.text("Sales Report", 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text(
        `Period: ${filterLabels[filter]}`,
        14,
        26
      );

      doc.text(
        `Total Sales: ${money(totalSales)}`,
        14,
        32
      );

      doc.text(
        `Items Sold: ${totalItemsSold.toLocaleString()}`,
        14,
        38
      );

      autoTable(doc, {
        startY: 45,
        head: [[
          "Product",
          "Customer",
          "Payment",
          "Quantity",
          "Total (Rs.)",
          "Date",
        ]],
        body: filteredSales.map((sale) => [
          sale.productName || "Unknown Product",
          sale.customerName || "Walk-in Customer",
          sale.paymentMethod || "Cash",
          String(sale.quantity || 0),
          Number(sale.totalAmount || 0).toLocaleString(
            "en-US"
          ),
          sale.createdAt
            ? new Date(sale.createdAt).toLocaleString(
                "en-GB"
              )
            : "Date unavailable",
        ]),
        theme: "striped",
        headStyles: {
          fillColor: [109, 40, 217],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
        },
        margin: {
          left: 14,
          right: 14,
        },
        columnStyles: {
          0: { cellWidth: 48 },
          1: { cellWidth: 48 },
          2: { cellWidth: 28 },
          3: { cellWidth: 22 },
          4: { cellWidth: 30 },
        },
      });

      // Page Numbers
      const pageCount =
        doc.internal.getNumberOfPages();

      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        doc.text(
          `SmartStock AI | Page ${page} of ${pageCount}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 7,
          { align: "right" }
        );
      }

      // Download the PDF
      doc.save(
        `SmartStock-Report-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (err) {
      console.error("PDF download error:", err);
      window.alert(
        "Unable to generate the PDF report. Please try again."
      );
    }
  };

  return (
    <main className="min-h-screen bg-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-semibold text-purple-600">
              SMARTSTOCK AI
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Reports 📊
            </h1>

            <p className="mt-2 text-slate-500">
              View inventory and sales performance reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadReports}
              disabled={loading}
              className="rounded-xl bg-purple-100 px-5 py-3 font-semibold text-purple-700 transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "↻ Refresh Reports"}
            </button>

            <button
              onClick={downloadPDF}
              disabled={loading || !!error}
              className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ⬇ Download PDF
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">
              Unable to load reports
            </p>

            <p className="mt-1 text-sm">{error}</p>

            <button
              onClick={loadReports}
              disabled={loading}
              className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold hover:bg-red-200 disabled:opacity-50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Date Filter */}
        <section className="mb-8 rounded-2xl border border-purple-100 bg-purple-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Sales Period
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a period to view sales performance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["today", "Today"],
                ["week", "This Week"],
                ["month", "This Month"],
                ["all", "All Time"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    filter === value
                      ? "bg-purple-600 text-white"
                      : "bg-white text-slate-600 hover:bg-purple-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-2xl p-6">
            <div className="text-3xl">📦</div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Total Products
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? "..." : totalProducts}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Products in inventory
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-3xl">📊</div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Total Stock
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {loading ? "..." : totalStock.toLocaleString()}
            </h2>

            <p className="mt-2 text-xs text-slate-400">
              Units currently available
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-3xl">💰</div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              {filterLabels[filter]} Sales
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : `Rs. ${totalSales.toLocaleString()}`}
            </h2>

            <p className="mt-2 text-xs text-green-600">
              {filteredSales.length} sales
            </p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-3xl">🛒</div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Items Sold
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {loading
                ? "..."
                : totalItemsSold.toLocaleString()}
            </h2>

            <p className="mt-2 text-xs text-purple-600">
              {filterLabels[filter]}
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Payment Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sales breakdown by payment method.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
              <p className="text-sm font-semibold text-green-700">
                Cash Sales 💵
              </p>

              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {loading
                  ? "..."
                  : `Rs. ${cashSales.toLocaleString()}`}
              </h3>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <p className="text-sm font-semibold text-blue-700">
                Card Sales 💳
              </p>

              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {loading
                  ? "..."
                  : `Rs. ${cardSales.toLocaleString()}`}
              </h3>
            </div>
          </div>
        </section>

        {/* Stock Overview */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Stock Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current inventory status.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass rounded-2xl p-6">
              <p className="text-sm font-semibold text-slate-500">
                Healthy Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {loading ? "..." : healthyStockCount}
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <p className="text-sm font-semibold text-slate-500">
                Low Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {loading ? "..." : lowStockProducts.length}
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <p className="text-sm font-semibold text-slate-500">
                Out of Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {loading ? "..." : outOfStockProducts.length}
              </p>
            </div>
          </div>
        </section>

        {/* Product Stock Report */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Product Stock Report
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Detailed stock information for all products.
            </p>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Loading product report...
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No products available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        "Product",
                        "SKU",
                        "Category",
                        "Price",
                        "Stock",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-left text-sm font-bold text-slate-700"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => {
                      const stock = Number(product.stock || 0);
                      const minimumStock = Number(
                        product.minimumStock || 0
                      );

                      const isOutOfStock = stock === 0;

                      const isLowStock =
                        stock > 0 && stock <= minimumStock;

                      return (
                        <tr
                          key={product._id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {product.name}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {product.sku || "N/A"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {product.category || "N/A"}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold">
                            Rs.{" "}
                            {Number(
                              product.price || 0
                            ).toLocaleString()}
                          </td>

                          <td className="px-5 py-4 font-bold">
                            {stock}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                isOutOfStock
                                  ? "bg-red-100 text-red-700"
                                  : isLowStock
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {isOutOfStock
                                ? "Out of Stock"
                                : isLowStock
                                ? "Low Stock"
                                : "Healthy"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Sales Report */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Sales Report
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing: {filterLabels[filter]}
              </p>
            </div>

            <div className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
              {filteredSales.length} Sales
            </div>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Loading sales report...
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No sales found for{" "}
                {filterLabels[filter].toLowerCase()}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        "Product",
                        "Customer",
                        "Payment",
                        "Quantity",
                        "Total",
                        "Date",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-4 text-left text-sm font-bold text-slate-700"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr
                        key={sale._id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {sale.productName || "Unknown Product"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {sale.customerName || "Walk-in Customer"}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              String(
                                sale.paymentMethod || ""
                              ).toLowerCase() === "card"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {sale.paymentMethod || "Cash"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold">
                          {sale.quantity || 0}
                        </td>

                        <td className="px-5 py-4 font-bold text-purple-600">
                          Rs.{" "}
                          {Number(
                            sale.totalAmount || 0
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {sale.createdAt
                            ? new Date(
                                sale.createdAt
                              ).toLocaleString()
                            : "Date unavailable"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}