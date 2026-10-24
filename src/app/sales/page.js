"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const PRODUCT_API = "https://smart-stock-ai-backend.vercel.app/api/products";
const SALES_API = "https://smart-stock-ai-backend.vercel.app/api/sales";

function getToken() {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

async function readResponse(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getProductList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return null;
}

function getSalesList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.sales)) return data.sales;
  if (Array.isArray(data?.data)) return data.data;
  return null;
}

function getErrorMessage(data, fallback) {
  return (
    data?.message ||
    data?.error ||
    data?.details ||
    fallback
  );
}

function SalesContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Load products and sales
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const token = getToken();

      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [productsResponse, salesResponse] =
        await Promise.all([
          fetch(PRODUCT_API, { headers }),
          fetch(SALES_API, { headers }),
        ]);

      const [productsData, salesData] = await Promise.all([
        readResponse(productsResponse),
        readResponse(salesResponse),
      ]);

      console.log(
        "Products API:",
        productsResponse.status,
        productsData
      );

      console.log(
        "Sales API:",
        salesResponse.status,
        salesData
      );

      if (!productsResponse.ok) {
        throw new Error(
          getErrorMessage(
            productsData,
            `Products API failed (${productsResponse.status})`
          )
        );
      }

      if (!salesResponse.ok) {
        throw new Error(
          getErrorMessage(
            salesData,
            `Sales API failed (${salesResponse.status})`
          )
        );
      }

      const productList = getProductList(productsData);
      const salesList = getSalesList(salesData);

      if (!productList) {
        throw new Error(
          "Products API did not return a valid product list."
        );
      }

      if (!salesList) {
        throw new Error(
          "Sales API did not return a valid sales list."
        );
      }

      setProducts(productList);
      setSales(salesList);
    } catch (error) {
      console.error("Failed to load sales page data:", error);
      setLoadError(error.message || "Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Select product received from Scanner
  useEffect(() => {
    const productId = searchParams.get("productId");

    if (!productId || products.length === 0) return;

    const scannedProduct = products.find(
      (item) => String(item._id) === String(productId)
    );

    if (scannedProduct) {
      setSelectedProduct(scannedProduct._id);
    }
  }, [searchParams, products]);

  // Selected product
  const product = products.find(
    (item) => String(item._id) === String(selectedProduct)
  );

  // Complete Sale
  const handleSale = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!selectedProduct) {
      alert("Please select a product.");
      return;
    }

    if (!quantity.trim()) {
      alert("Please enter quantity.");
      return;
    }

    const saleQuantity = Number(quantity);

    if (!Number.isInteger(saleQuantity) || saleQuantity < 1) {
      alert("Quantity must be a whole number greater than 0.");
      return;
    }

    if (!product) {
      alert("Product not found. Please reload the page.");
      return;
    }

    const availableStock = Number(product.stock || 0);

    if (availableStock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    if (saleQuantity > availableStock) {
      alert(
        `Not enough stock available. Available stock: ${availableStock}`
      );
      return;
    }

    const price = Number(product.price || 0);

    if (!Number.isFinite(price) || price < 0) {
      alert("The product price is invalid.");
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      const headers = {
        "Content-Type": "application/json",
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      };

      const totalAmount = saleQuantity * price;

      const saleResponse = await fetch(SALES_API, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId: product._id,
          productName: product.name,
          quantity: saleQuantity,
          price,
          totalAmount,
          customerName:
            customerName.trim() || "Walk-in Customer",
          paymentMethod,
        }),
      });

      const saleData = await readResponse(saleResponse);

      if (!saleResponse.ok) {
        throw new Error(
          getErrorMessage(
            saleData,
            `Failed to complete sale (${saleResponse.status})`
          )
        );
      }

      // Add the new sale to history
      const newSale = saleData.sale || saleData;

      if (newSale && newSale._id) {
        setSales((previousSales) => [
          newSale,
          ...previousSales,
        ]);
      }

      // Reload products to obtain the latest stock
      const productsResponse = await fetch(PRODUCT_API, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      const updatedData = await readResponse(productsResponse);

      if (productsResponse.ok) {
        const updatedProducts = getProductList(updatedData);

        if (updatedProducts) {
          setProducts(updatedProducts);
        }
      } else {
        console.error(
          "Sale was saved, but products could not be refreshed:",
          updatedData
        );
      }

      // Clear form
      setSelectedProduct("");
      setQuantity("");
      setCustomerName("");
      setPaymentMethod("Cash");

      // Remove Scanner productId from URL
      window.history.replaceState({}, "", "/sales");

      alert("Sale completed successfully! ✅");
    } catch (error) {
      console.error("Sale error:", error);
      alert(error.message || "Failed to complete sale.");
    } finally {
      setSaving(false);
    }
  };

  // Total sales
  const totalSales = sales.reduce(
    (total, sale) =>
      total + Number(sale.totalAmount || 0),
    0
  );

  // Total items sold
  const totalItemsSold = sales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  );

  return (
    <main className="min-h-screen bg-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="font-semibold text-purple-600">
            SMARTSTOCK AI
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Sales 💰
          </h1>

          <p className="mt-2 text-slate-500">
            Record sales and automatically update your inventory.
          </p>
        </div>

        {/* Load error */}
        {loadError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <p className="font-semibold">
              Failed to load sales data
            </p>

            <p className="mt-1 text-sm">{loadError}</p>

            <button
              type="button"
              onClick={loadData}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="glass rounded-2xl p-6">
            <p className="text-sm font-semibold text-slate-500">
              Total Sales
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Rs. {totalSales.toLocaleString()}
            </h2>
          </div>

          <div className="glass rounded-2xl p-6">
            <p className="text-sm font-semibold text-slate-500">
              Items Sold
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {totalItemsSold}
            </h2>
          </div>

          <div className="glass rounded-2xl p-6">
            <p className="text-sm font-semibold text-slate-500">
              Available Products
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "..." : products.length}
            </h2>
          </div>
        </div>

        {/* New Sale */}
        <section className="glass rounded-3xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Record New Sale
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a product and enter the quantity sold.
          </p>

          <form
            onSubmit={handleSale}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            {/* Product */}
            <div>
              <label
                htmlFor="sale-product"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Product
              </label>

              <select
                id="sale-product"
                value={selectedProduct}
                onChange={(e) =>
                  setSelectedProduct(e.target.value)
                }
                required
                className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="">Select a product</option>

                {products.map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                    disabled={Number(item.stock) <= 0}
                  >
                    {item.name} — Stock: {item.stock}
                  </option>
                ))}
              </select>

              {!loading && products.length === 0 && (
                <p className="mt-2 text-sm text-amber-600">
                  No products available. Add products to inventory first.
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="sale-quantity"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Quantity
              </label>

              <input
                id="sale-quantity"
                type="number"
                min="1"
                max={product?.stock || undefined}
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
                className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {/* Customer */}
            <div>
              <label
                htmlFor="customer-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Customer Name
              </label>

              <input
                id="customer-name"
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                placeholder="Optional"
                className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {/* Payment Method */}
            <div>
              <p className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Method
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Cash")}
                  aria-pressed={paymentMethod === "Cash"}
                  className={`rounded-xl border px-4 py-3 font-semibold transition ${
                    paymentMethod === "Cash"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-purple-100 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  💵 Cash
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Card")}
                  aria-pressed={paymentMethod === "Card"}
                  className={`rounded-xl border px-4 py-3 font-semibold transition ${
                    paymentMethod === "Card"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-purple-100 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  💳 Card
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="rounded-xl bg-purple-50 p-4">
              {product ? (
                <>
                  <p className="text-sm font-semibold text-purple-700">
                    Selected Product
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {product.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    Price: Rs.{" "}
                    {Number(product.price || 0).toLocaleString()}
                  </p>

                  <p className="text-sm text-slate-500">
                    Available Stock: {product.stock}
                  </p>

                  {quantity && Number(quantity) > 0 && (
                    <p className="mt-2 font-bold text-purple-700">
                      Total: Rs.{" "}
                      {(
                        Number(quantity) *
                        Number(product.price || 0)
                      ).toLocaleString()}
                    </p>
                  )}

                  {searchParams.get("productId") && (
                    <p className="mt-2 text-sm font-semibold text-green-600">
                      📷 Product selected from Scanner
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Select a product to see details.
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={
                  saving ||
                  loading ||
                  !product ||
                  Number(product.stock) <= 0
                }
                className={`w-full rounded-xl px-6 py-3 font-semibold text-white transition ${
                  saving ||
                  loading ||
                  !product ||
                  Number(product.stock) <= 0
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {saving
                  ? "Processing Sale..."
                  : "✓ Complete Sale"}
              </button>
            </div>
          </form>
        </section>

        {/* Sales History */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Sales History
            </h2>

            <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
              {sales.length} Sales
            </span>
          </div>

          {loading ? (
            <div className="glass rounded-2xl p-8 text-center">
              Loading sales...
            </div>
          ) : sales.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="text-5xl">💰</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                No sales recorded yet
              </h3>

              <p className="mt-2 text-slate-500">
                Record your first sale using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sales.map((sale, index) => (
                <div
                  key={sale._id || `${sale.productId}-${index}`}
                  className="glass flex flex-col justify-between gap-4 rounded-2xl p-5 md:flex-row md:items-center"
                >
                  {/* Sale Info */}
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {sale.productName || "Product"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Customer:{" "}
                      {sale.customerName || "Walk-in Customer"}
                    </p>

                    <p className="text-sm text-slate-500">
                      Payment:{" "}
                      <span className="font-semibold text-purple-600">
                        {sale.paymentMethod || "Cash"}
                      </span>
                    </p>

                    <p className="text-xs text-slate-400">
                      {sale.createdAt
                        ? new Date(sale.createdAt).toLocaleString()
                        : "Date unavailable"}
                    </p>
                  </div>

                  {/* Sale Amount */}
                  <div className="text-left md:text-right">
                    <p className="font-bold text-purple-600">
                      Rs.{" "}
                      {Number(
                        sale.totalAmount || 0
                      ).toLocaleString()}
                    </p>

                    <p className="text-sm text-slate-500">
                      Quantity: {sale.quantity ?? 0}
                    </p>

                    <p className="text-xs text-slate-400">
                      Unit Price: Rs.{" "}
                      {Number(
                        sale.price || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function SalesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          <p className="font-semibold text-purple-600">
            Loading sales...
          </p>
        </main>
      }
    >
      <SalesContent />
    </Suspense>
  );
}
