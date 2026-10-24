"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PRODUCT_API =
  "https://smart-stock-ai-backend.vercel.app/api/products";

const SALES_API =
  "https://smart-stock-ai-backend.vercel.app/api/sales";

function POSContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState("0");
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

  const readResponse = async (response) => {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text };
    }
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    router.replace("/login");
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(PRODUCT_API, {
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
        throw new Error(
          data.message ||
            `Failed to fetch products (${response.status})`
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      setProducts(list);
    } catch (error) {
      console.error("Load products error:", error);
      setMessage(error.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = (product) => {
    const stock = Number(product.stock);
    const price = Number(product.price);

    if (stock <= 0) {
      setMessage(`${product.name} is out of stock.`);
      return;
    }

    setMessage("");

    setCart((current) => {
      const existing = current.find(
        (item) => item.productId === product._id
      );

      if (existing) {
        if (existing.quantity >= stock) {
          setMessage(`Only ${stock} units available.`);
          return current;
        }

        return current.map((item) =>
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
        ...current,
        {
          productId: product._id,
          productName: product.name,
          price,
          quantity: 1,
          stock,
          total: price,
        },
      ];
    });
  };

  useEffect(() => {
    const productId = searchParams.get("productId");

    if (!productId || products.length === 0) return;
    if (processedProductId.current === productId) return;

    const product = products.find(
      (item) => item._id === productId
    );

    if (!product) {
      setMessage("Scanned product was not found.");
      return;
    }

    processedProductId.current = productId;
    addToCart(product);
    window.history.replaceState({}, "", "/pos");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, products]);

  const increaseQuantity = (productId) => {
    setCart((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;

        if (item.quantity >= item.stock) {
          setMessage(`Only ${item.stock} units available.`);
          return item;
        }

        const quantity = item.quantity + 1;

        return {
          ...item,
          quantity,
          total: quantity * item.price,
        };
      })
    );
  };

  const decreaseQuantity = (productId) => {
    setCart((current) =>
      current
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
    setCart((current) =>
      current.filter((item) => item.productId !== productId)
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount("0");
    setCashReceived("");
    setMessage("");
  };

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.barcode,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [products, search]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const discountAmount = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  );

  const grandTotal = Math.max(
    subtotal - discountAmount,
    0
  );

  const cashAmount = Number(cashReceived) || 0;

  const changeAmount =
    paymentMethod === "Cash"
      ? Math.max(cashAmount - grandTotal, 0)
      : 0;

  const insufficientCash =
    paymentMethod === "Cash" &&
    cashReceived !== "" &&
    cashAmount < grandTotal;

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

    if (
      paymentMethod === "Cash" &&
      (cashReceived === "" || cashAmount < grandTotal)
    ) {
      setMessage(
        cashReceived === ""
          ? "Please enter cash received."
          : `Insufficient cash. Need Rs. ${(
              grandTotal - cashAmount
            ).toFixed(2)} more.`
      );
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setProcessing(true);
      setMessage("");

      const receiptItems = cart.map((item) => {
        const itemTotal = item.total;

        const itemDiscount =
          subtotal > 0
            ? (itemTotal / subtotal) * discountAmount
            : 0;

        return {
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: Number(
            (itemTotal - itemDiscount).toFixed(2)
          ),
        };
      });

      // Keep the request fields compatible with your backend API.
      for (let index = 0; index < cart.length; index++) {
        const item = cart[index];

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
            totalAmount: receiptItems[index].total,
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
          throw new Error(
            data.message ||
              `Failed to complete sale (${response.status})`
          );
        }
      }

      setReceipt({
        receiptNumber: `SS-${Date.now()}`,
        date: new Date().toLocaleString(),
        items: receiptItems,
        subtotal,
        discount: discountAmount,
        grandTotal,
        paymentMethod,
        cashReceived:
          paymentMethod === "Cash" ? cashAmount : 0,
        change:
          paymentMethod === "Cash" ? changeAmount : 0,
      });

      setMessage("Sale completed successfully!");
      setCart([]);
      setDiscount("0");
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

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-6 py-4 shadow-sm print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              POS Checkout
            </h1>
            <p className="text-sm text-slate-500">
              SmartStock AI · Point of Sale
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {receipt ? (
        <div className="mx-auto max-w-2xl p-6 print:max-w-none print:p-0">
          <div className="rounded-2xl border bg-white p-8 shadow-sm print:border-0 print:shadow-none">
            <div className="mb-6 border-b border-dashed pb-5 text-center">
              <h2 className="text-2xl font-extrabold">
                SmartStock AI
              </h2>
              <p className="text-sm text-slate-500">
                Sales Receipt
              </p>
              <p className="mt-3 text-sm">
                Receipt No: {receipt.receiptNumber}
              </p>
              <p className="text-sm text-slate-500">
                {receipt.date}
              </p>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-12 gap-2 border-b pb-2 text-xs font-bold uppercase text-slate-500">
                <span className="col-span-5">Product</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-3 text-right">Total</span>
              </div>

              {receipt.items.map((item, index) => (
                <div
                  key={`${item.productName}-${index}`}
                  className="grid grid-cols-12 gap-2 border-b py-3 text-sm"
                >
                  <span className="col-span-5 break-words">
                    {item.productName}
                  </span>
                  <span className="col-span-2 text-center">
                    {item.quantity}
                  </span>
                  <span className="col-span-2 text-right">
                    Rs. {item.price.toFixed(2)}
                  </span>
                  <span className="col-span-3 text-right font-semibold">
                    Rs. {item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="ml-auto max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>Rs. {receipt.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Discount</span>
                <span>
                  - Rs. {receipt.discount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3 text-lg font-extrabold">
                <span>Total</span>
                <span>Rs. {receipt.grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Payment Method</span>
                <span>{receipt.paymentMethod}</span>
              </div>

              {receipt.paymentMethod === "Cash" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Cash Received</span>
                    <span>
                      Rs. {receipt.cashReceived.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-green-700">
                    <span>Change</span>
                    <span>
                      Rs. {receipt.change.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 border-t border-dashed pt-5 text-center">
              <p className="font-semibold">
                Thank you for shopping!
              </p>
              <p className="text-sm text-slate-500">
                Please visit us again.
              </p>
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700"
              >
                🖨️ Print Receipt
              </button>

              <button
                onClick={closeReceipt}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold hover:bg-slate-200"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-bold">
                Products
              </h2>

              <input
                type="text"
                placeholder="Search product, SKU or barcode..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mb-5 w-full rounded-xl border px-4 py-3 outline-none focus:border-purple-500"
              />

              {message && (
                <div
                  className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                    message.includes("successfully")
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}

              {loading ? (
                <p className="py-10 text-center text-slate-500">
                  Loading products...
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="rounded-xl bg-slate-50 py-10 text-center text-slate-500">
                  No products found.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="rounded-2xl border p-4 transition hover:shadow-md"
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

                      <h3 className="truncate font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        SKU: {product.sku || "N/A"}
                      </p>

                      <div className="mt-3 flex justify-between gap-2">
                        <span className="font-bold text-purple-700">
                          Rs. {Number(product.price || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500">
                          Stock: {product.stock}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={Number(product.stock) <= 0}
                        className="mt-4 w-full rounded-xl bg-purple-600 px-4 py-2.5 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
            <div className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Shopping Cart
                  </h2>
                  <p className="text-sm text-slate-500">
                    {cart.length} product
                    {cart.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm font-medium text-red-500"
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
                      className="rounded-xl border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">
                            {item.productName}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Rs. {item.price.toFixed(2)} each
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.productId)
                          }
                          className="text-red-500"
                          aria-label={`Remove ${item.productName}`}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border">
                          <button
                            onClick={() =>
                              decreaseQuantity(item.productId)
                            }
                            className="px-3 py-1.5 text-lg"
                          >
                            −
                          </button>

                          <span className="min-w-8 text-center font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(item.productId)
                            }
                            className="px-3 py-1.5 text-lg"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold">
                          Rs. {item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>Rs. {subtotal.toFixed(2)}</span>
                    </div>

                    <div>
                      <label
                        htmlFor="discount"
                        className="mb-1 block text-sm font-medium"
                      >
                        Discount (Rs.)
                      </label>
                      <input
                        id="discount"
                        type="number"
                        min="0"
                        max={subtotal}
                        value={discount}
                        onChange={(event) =>
                          setDiscount(event.target.value)
                        }
                        className="w-full rounded-xl border px-3 py-2"
                      />
                    </div>

                    <div className="flex justify-between border-t pt-3 text-lg font-extrabold">
                      <span>Total</span>
                      <span>Rs. {grandTotal.toFixed(2)}</span>
                    </div>

                    <div>
                      <label
                        htmlFor="paymentMethod"
                        className="mb-1 block text-sm font-medium"
                      >
                        Payment Method
                      </label>
                      <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(event) => {
                          setPaymentMethod(event.target.value);
                          setCashReceived("");
                        }}
                        className="w-full rounded-xl border px-3 py-2"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>

                    {paymentMethod === "Cash" && (
                      <div>
                        <label
                          htmlFor="cashReceived"
                          className="mb-1 block text-sm font-medium"
                        >
                          Cash Received (Rs.)
                        </label>
                        <input
                          id="cashReceived"
                          type="number"
                          min="0"
                          value={cashReceived}
                          onChange={(event) =>
                            setCashReceived(event.target.value)
                          }
                          placeholder="Enter cash amount"
                          className="w-full rounded-xl border px-3 py-2"
                        />

                        {cashReceived !== "" && (
                          <div
                            className={`mt-2 text-sm ${
                              insufficientCash
                                ? "text-red-600"
                                : "text-green-700"
                            }`}
                          >
                            {insufficientCash
                              ? `Need Rs. ${(grandTotal - cashAmount).toFixed(2)} more`
                              : `Change: Rs. ${changeAmount.toFixed(2)}`}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={completeSale}
                      disabled={
                        processing ||
                        cart.length === 0 ||
                        grandTotal <= 0 ||
                        (paymentMethod === "Cash" &&
                          (cashReceived === "" ||
                            insufficientCash))
                      }
                      className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3.5 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {processing
                        ? "Processing..."
                        : "Complete Sale"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center">
          Loading POS...
        </div>
      }
    >
      <POSContent />
    </Suspense>
  );
}