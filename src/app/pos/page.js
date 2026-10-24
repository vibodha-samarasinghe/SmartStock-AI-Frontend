
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PRODUCT_API = "https://smart-stock-ai-backend.vercel.app/api/products";
const SALES_API = "https://smart-stock-ai-backend.vercel.app/api/sales";

export default function POSPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(null);

  const processedProductId = useRef(null);

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    setMessage("Session expired. Please log in again.");
    router.replace("/login");
  };

  const readResponse = async (response) => {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text };
    }
  };

  // Load products with authentication
  const loadProducts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = getToken();

      if (!token) {
        setMessage("Please log in to continue.");
        router.replace("/login");
        return;
      }

      const response = await fetch(PRODUCT_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await readResponse(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        console.error("Products API status:", response.status);
        console.error("Products API response:", data);

        throw new Error(
          data.message ||
            `Failed to fetch products (${response.status})`
        );
      }

      const productList = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      setProducts(productList);
    } catch (error) {
      console.error("Load products error:", error);
      setMessage(error.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // Initial product loading only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a scanned product from the URL to the cart
  useEffect(() => {
    const productId = searchParams.get("productId");

    if (!productId || products.length === 0) return;
    if (processedProductId.current === productId) return;

    const scannedProduct = products.find(
      (item) => item._id === productId
    );

    if (!scannedProduct) {
      setMessage("Scanned product was not found.");
      return;
    }

    processedProductId.current = productId;

    if (Number(scannedProduct.stock) <= 0) {
      setMessage(`${scannedProduct.name} is out of stock.`);
      window.history.replaceState({}, "", "/pos");
      return;
    }

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.productId === scannedProduct._id
      );

      if (existingProduct) {
        if (
          existingProduct.quantity >=
          Number(scannedProduct.stock)
        ) {
          setMessage(
            `Only ${scannedProduct.stock} units available.`
          );
          return currentCart;
        }

        return currentCart.map((item) =>
          item.productId === scannedProduct._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId: scannedProduct._id,
          productName: scannedProduct.name,
          price: Number(scannedProduct.price),
          quantity: 1,
          stock: Number(scannedProduct.stock),
          total: Number(scannedProduct.price),
        },
      ];
    });

    setMessage(
      `${scannedProduct.name} added to cart from scanner.`
    );

    window.history.replaceState({}, "", "/pos");
  }, [searchParams, products]);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) =>
      product.name?.toLowerCase().includes(keyword) ||
      product.sku?.toLowerCase().includes(keyword) ||
      product.barcode?.toLowerCase().includes(keyword)
    );
  }, [products, search]);

  const addToCart = (product) => {
    if (Number(product.stock) <= 0) {
      setMessage(`${product.name} is out of stock.`);
      return;
    }

    setMessage("");

    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.productId === product._id
      );

      if (existingProduct) {
        if (
          existingProduct.quantity >= Number(product.stock)
        ) {
          setMessage(`Only ${product.stock} units available.`);
          return currentCart;
        }

        return currentCart.map((item) =>
          item.productId === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId: product._id,
          productName: product.name,
          price: Number(product.price),
          quantity: 1,
          stock: Number(product.stock),
          total: Number(product.price),
        },
      ];
    });
  };

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.productId !== productId) return item;

        if (item.quantity >= item.stock) {
          setMessage(`Only ${item.stock} units available.`);
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
          total: (item.quantity + 1) * item.price,
        };
      })
    );
  };

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.productId !== productId) return item;

          const quantity = item.quantity - 1;

          return {
            ...item,
            quantity,
            total: quantity * item.price,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.productId !== productId)
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashReceived("");
    setMessage("");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const discountAmount = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  );

  const grandTotal = subtotal - discountAmount;
  const cashAmount = Number(cashReceived) || 0;

  const changeAmount =
    paymentMethod === "Cash"
      ? Math.max(cashAmount - grandTotal, 0)
      : 0;

  const insufficientCash =
    paymentMethod === "Cash" &&
    cashReceived !== "" &&
    cashAmount < grandTotal;

  // Complete sale
  const completeSale = async () => {
    if (processing) return;

    if (cart.length === 0) {
      setMessage("Please add products to the cart.");
      return;
    }

    if (grandTotal <= 0) {
      setMessage("Total amount must be greater than 0.");
      return;
    }

    if (paymentMethod === "Cash") {
      if (cashReceived === "") {
        setMessage("Please enter cash received.");
        return;
      }

      if (cashAmount < grandTotal) {
        setMessage(
          `Insufficient cash. Need Rs. ${(grandTotal - cashAmount).toFixed(2)} more.`
        );
        return;
      }
    }

    const token = getToken();

    if (!token) {
      setMessage("Please log in to continue.");
      router.replace("/login");
      return;
    }

    try {
      setProcessing(true);
      setMessage("");

      const receiptItems = cart.map((item) => {
        const itemTotal = item.quantity * item.price;

        const itemDiscount =
          subtotal > 0
            ? (itemTotal / subtotal) * discountAmount
            : 0;

        return {
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: Number((itemTotal - itemDiscount).toFixed(2)),
        };
      });

      // Each cart item is submitted as one sale request.
      for (let index = 0; index < cart.length; index++) {
        const item = cart[index];
        const receiptItem = receiptItems[index];

        const response = await fetch(SALES_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            totalAmount: receiptItem.total,
            customerName: "Walk-in Customer",
            paymentMethod,
          }),
        });

        const data = await readResponse(response);

        if (response.status === 401) {
          handleUnauthorized();
          throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok) {
          console.error("Sales API status:", response.status);
          console.error("Sales API response:", data);

          throw new Error(
            data.message ||
              `Failed to complete sale (${response.status})`
          );
        }
      }

      const receiptData = {
        receiptNumber: `SS-${Date.now()}`,
        date: new Date().toLocaleString(),
        items: receiptItems,
        subtotal,
        discount: discountAmount,
        grandTotal,
        paymentMethod,
        cashReceived: paymentMethod === "Cash" ? cashAmount : 0,
        change: paymentMethod === "Cash" ? changeAmount : 0,
      };

      setReceipt(receiptData);
      setMessage("Sale completed successfully!");

      setCart([]);
      setDiscount(0);
      setCashReceived("");

      await loadProducts();
    } catch (error) {
      console.error("Complete sale error:", error);
      setMessage(error.message || "Failed to complete sale.");
    } finally {
      setProcessing(false);
    }
  };

  const closeReceipt = () => {
    setReceipt(null);
    setMessage("");
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-6 py-4 shadow-sm print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              POS Checkout
            </h1>
            <p className="text-sm text-slate-500">Point of Sale</p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-200"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main
        className={`mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-3 ${
          receipt ? "print:hidden" : ""
        }`}
      >
        <section className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="mb-3 text-lg font-bold text-slate-800">
                Products
              </h2>

              <input
                type="text"
                placeholder="Search by product name, SKU or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {message && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
                  message.includes("successfully") ||
                  message.includes("added to cart")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message}
              </div>
            )}

            {loading ? (
              <div className="py-10 text-center text-slate-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-10 text-center text-slate-500">
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>

                    <h3 className="truncate font-bold text-slate-800">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      SKU: {product.sku || "N/A"}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-purple-700">
                        Rs. {Number(product.price || 0).toFixed(2)}
                      </span>

                      <span
                        className={`text-xs font-semibold ${
                          Number(product.stock) > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={Number(product.stock) <= 0}
                      className={`mt-4 w-full rounded-xl px-4 py-2.5 font-semibold transition ${
                        Number(product.stock) > 0
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "cursor-not-allowed bg-slate-200 text-slate-400"
                      }`}
                    >
                      {Number(product.stock) > 0
                        ? "Add to Cart"
                        : "Out of Stock"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="sticky top-6 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Shopping Cart
                </h2>
                <p className="text-sm text-slate-500">
                  {cart.length} product{cart.length !== 1 ? "s" : ""}
                </p>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-12 text-center">
                <div className="mb-3 text-5xl">🛒</div>
                <p className="font-medium text-slate-600">
                  Your cart is empty
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Add products to start a sale
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-800">
                          {item.productName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Rs. {item.price.toFixed(2)} each
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-lg text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          onClick={() => decreaseQuantity(item.productId)}
                          className="px-3 py-1.5 text-lg font-bold text-slate-600 hover:bg-slate-100"
                        >
                          −
                        </button>

                        <span className="min-w-10 text-center font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(item.productId)}
                          className="px-3 py-1.5 text-lg font-bold text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-slate-800">
                        Rs. {item.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Discount (Rs.)
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Discount</span>
                    <span>- Rs. {discountAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold text-slate-800">
                    <span>Grand Total</span>
                    <span className="text-purple-700">
                      Rs. {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Payment Method
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setPaymentMethod("Cash");
                        setCashReceived("");
                      }}
                      className={`rounded-xl border px-4 py-3 font-semibold transition ${
                        paymentMethod === "Cash"
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      💵 Cash
                    </button>

                    <button
                      onClick={() => {
                        setPaymentMethod("Card");
                        setCashReceived("");
                      }}
                      className={`rounded-xl border px-4 py-3 font-semibold transition ${
                        paymentMethod === "Card"
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      💳 Card
                    </button>
                  </div>
                </div>

                {paymentMethod === "Cash" && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cash Received (Rs.)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="Enter cash amount"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />

                    {cashReceived !== "" && (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Grand Total</span>
                          <span>Rs. {grandTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Cash Received</span>
                          <span>Rs. {cashAmount.toFixed(2)}</span>
                        </div>

                        {insufficientCash ? (
                          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                            ⚠️ Insufficient cash
                          </div>
                        ) : (
                          <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-green-600">
                            <span>Change</span>
                            <span>Rs. {changeAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={completeSale}
                  disabled={processing}
                  className={`mt-5 w-full rounded-xl px-5 py-3.5 font-bold text-white transition ${
                    processing
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {processing
                    ? "Processing Sale..."
                    : "✓ Complete Sale"}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {receipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-center justify-center">
            <div
              id="receipt"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="text-center">
                <div className="text-3xl">🛍️</div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  SMARTSTOCK AI
                </h2>
                <p className="text-sm text-slate-500">POS Receipt</p>

                <div className="mt-3 border-t border-dashed border-slate-300 pt-3">
                  <p className="text-sm text-slate-500">Receipt No:</p>
                  <p className="font-bold text-slate-800">
                    {receipt.receiptNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {receipt.date}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-y border-dashed border-slate-300 py-4">
                <div className="mb-3 grid grid-cols-12 text-xs font-bold text-slate-500">
                  <span className="col-span-5">Product</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-3 text-right">Total</span>
                </div>

                <div className="space-y-3">
                  {receipt.items.map((item, index) => (
                    <div
                      key={`${item.productName}-${index}`}
                      className="grid grid-cols-12 text-sm"
                    >
                      <span className="col-span-5 break-words font-medium text-slate-800">
                        {item.productName}
                      </span>
                      <span className="col-span-2 text-center text-slate-600">
                        {item.quantity}
                      </span>
                      <span className="col-span-2 text-right text-slate-600">
                        {Number(item.price).toFixed(2)}
                      </span>
                      <span className="col-span-3 text-right font-semibold text-slate-800">
                        {Number(item.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>Rs. {receipt.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount</span>
                  <span>- Rs. {receipt.discount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t border-slate-300 pt-3 text-xl font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-purple-700">
                    Rs. {receipt.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-bold text-purple-700">
                    {receipt.paymentMethod === "Cash" ? "💵 Cash" : "💳 Card"}
                  </span>
                </div>

                {receipt.paymentMethod === "Cash" && (
                  <>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate-500">Cash Received</span>
                      <span className="font-semibold text-slate-800">
                        Rs. {receipt.cashReceived.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-green-600">
                      <span>Change</span>
                      <span>Rs. {receipt.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 text-center">
                <p className="font-semibold text-slate-700">
                  Thank you for your purchase! ❤️
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Powered by SmartStock AI
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 print:hidden">
                <button
                  onClick={printReceipt}
                  className="rounded-xl bg-purple-600 px-4 py-3 font-bold text-white transition hover:bg-purple-700"
                >
                  🖨️ Print
                </button>

                <button
                  onClick={closeReceipt}
                  className="rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #receipt,
          #receipt * {
            visibility: visible;
          }

          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
