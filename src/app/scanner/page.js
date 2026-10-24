
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

const API_URL = "http://localhost:5001/api/products";

export default function ScannerPage() {
  const router = useRouter();

  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  const scannerRef = useRef(null);
  const scanHandledRef = useRef(false);
  const mountedRef = useRef(false);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  // Load products using the logged-in user's token
  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        showMessage("Please log in to use the barcode scanner.", "error");
        router.replace("/login");
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();

        console.error("Products API status:", response.status);
        console.error("Products API response:", responseText);

        if (response.status === 401) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");

          showMessage("Your session has expired. Please log in again.", "error");
          router.replace("/login");
          return;
        }

        throw new Error(
          `Failed to load products (${response.status}).`
        );
      }

      const data = await response.json();

      const productList = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      if (mountedRef.current) {
        setProducts(productList);
      }
    } catch (error) {
      console.error("Load products error:", error);

      if (mountedRef.current) {
        showMessage(
          error.message || "Unable to load products. Check your backend.",
          "error"
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    loadProducts();

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;

      if (scanner) {
        scannerRef.current = null;

        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear().catch(() => {});
          });
      }
    };
  }, [loadProducts]);

  // Search a product by barcode
  const searchProduct = (code) => {
    const searchCode = String(code || "").trim();

    if (!searchCode) {
      setProduct(null);
      showMessage("Please enter a barcode.", "error");
      return;
    }

    const foundProduct = products.find(
      (item) =>
        String(item.barcode || "").trim() === searchCode
    );

    if (foundProduct) {
      setProduct(foundProduct);
      showMessage("Product Found!", "success");
    } else {
      setProduct(null);
      showMessage("Product not found. Check the barcode.", "error");
    }
  };

  const handleSearch = () => {
    searchProduct(barcode);
  };

  // Stop camera scanner
  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setScanning(false);
      return;
    }

    scannerRef.current = null;

    try {
      await scanner.stop();
    } catch (error) {
      console.warn("Scanner stop:", error);
    }

    try {
      scanner.clear();
    } catch (error) {
      console.warn("Scanner clear:", error);
    }

    setScanning(false);
  };

  // Start camera scanner
  const startScanner = async () => {
    if (loading) {
      showMessage("Please wait while products are loading.", "info");
      return;
    }

    if (products.length === 0) {
      showMessage("No products available to search.", "error");
      return;
    }

    if (scannerRef.current) {
      return;
    }

    try {
      showMessage("Starting camera scanner...", "info");
      scanHandledRef.current = false;

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
        },
        async (decodedText) => {
          if (scanHandledRef.current) return;

          scanHandledRef.current = true;

          const scannedBarcode = String(decodedText).trim();

          setBarcode(scannedBarcode);
          searchProduct(scannedBarcode);

          await stopScanner();
        },
        () => {
          // Ignore errors while camera is searching for a barcode.
        }
      );

      setScanning(true);
      showMessage("Camera scanner started. Scan a barcode.", "info");
    } catch (error) {
      console.error("Scanner start error:", error);

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        try {
          scanner.clear();
        } catch {}
      }

      setScanning(false);
      showMessage(
        "Unable to start camera. Check camera permission and use localhost or HTTPS.",
        "error"
      );
    }
  };

  // Navigate to POS
  const sellProduct = () => {
    if (!product?._id) {
      showMessage("Please scan or search for a product first.", "error");
      return;
    }

    if (Number(product.stock || 0) <= 0) {
      showMessage(`${product.name || "This product"} is out of stock.`, "error");
      return;
    }

    router.push(`/pos?productId=${encodeURIComponent(product._id)}`);
  };

  const messageColors = {
    success: { background: "#dcfce7", color: "#166534" },
    error: { background: "#fee2e2", color: "#991b1b" },
    info: { background: "#dbeafe", color: "#1d4ed8" },
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          📷 Barcode Scanner
        </h1>

        <p style={{ color: "#6b7280", marginBottom: "30px" }}>
          Scan or enter a product barcode to find the product.
        </p>

        {/* Camera Scanner */}
        <section
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              marginBottom: "20px",
              color: "#111827",
            }}
          >
            📷 Camera Scanner
          </h2>

          <div
            id="reader"
            style={{
              width: "100%",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            {!scanning ? (
              <button
                onClick={startScanner}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  background: loading ? "#9ca3af" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Loading Products..." : "📷 Start Scanner"}
              </button>
            ) : (
              <button
                onClick={stopScanner}
                style={{
                  flex: 1,
                  padding: "13px 20px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ⛔ Stop Scanner
              </button>
            )}
          </div>
        </section>

        {/* Manual Search */}
        <section
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              marginBottom: "20px",
              color: "#111827",
            }}
          >
            🔎 Search Barcode
          </h2>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              placeholder="Enter barcode..."
              style={{
                flex: 1,
                minWidth: 0,
                padding: "13px 15px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: "13px 25px",
                background: "#111827",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </div>
        </section>

        {/* Status Message */}
        {message && (
          <div
            role="status"
            style={{
              padding: "15px 18px",
              marginBottom: "25px",
              borderRadius: "10px",
              fontWeight: "600",
              ...messageColors[messageType],
            }}
          >
            {message}
          </div>
        )}

        {/* Product Result */}
        {product && (
          <section
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "700",
                marginBottom: "20px",
                color: "#111827",
              }}
            >
              ✅ Product Found
            </h2>

            {product.image && (
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <img
                  src={product.image}
                  alt={product.name || "Product"}
                  style={{
                    width: "180px",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            )}

            <div style={{ display: "grid", gap: "12px", color: "#111827" }}>
              <div>
                <strong>Product Name:</strong> {product.name || "N/A"}
              </div>
              <div>
                <strong>SKU:</strong> {product.sku || "N/A"}
              </div>
              <div>
                <strong>Barcode:</strong> {product.barcode || "N/A"}
              </div>
              <div>
                <strong>Category:</strong> {product.category || "N/A"}
              </div>
              <div>
                <strong>Price:</strong> Rs. {Number(product.price || 0).toFixed(2)}
              </div>
              <div>
                <strong>Stock:</strong> {Number(product.stock || 0)}
              </div>

              {product.description && (
                <div>
                  <strong>Description:</strong> {product.description}
                </div>
              )}
            </div>

            <button
              onClick={sellProduct}
              disabled={Number(product.stock || 0) <= 0}
              style={{
                marginTop: "25px",
                width: "100%",
                padding: "14px 25px",
                background:
                  Number(product.stock || 0) <= 0 ? "#9ca3af" : "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor:
                  Number(product.stock || 0) <= 0 ? "not-allowed" : "pointer",
              }}
            >
              {Number(product.stock || 0) <= 0
                ? "❌ Out of Stock"
                : "🛒 Sell This Product"}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
