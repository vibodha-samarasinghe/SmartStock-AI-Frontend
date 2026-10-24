
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5001/api/products";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  price: "",
  stock: "",
  minimumStock: "",
  barcode: "",
  description: "",
  image: "",
};

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const fileInputRef = useRef(null);

  const getToken = () =>
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    window.location.href = "/login";
  };

  const readResponse = async (response) => {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text };
    }
  };

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setProducts([]);
        setError("Please log in to access inventory.");
        return;
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to load products (${response.status})`
        );
      }

      let productList;

      if (Array.isArray(data)) {
        productList = data;
      } else if (Array.isArray(data.products)) {
        productList = data.products;
      } else if (Array.isArray(data.data)) {
        productList = data.data;
      } else {
        console.error("Unexpected products API response:", data);
        throw new Error(
          "The backend response does not contain a products array."
        );
      }

      setProducts(productList);
    } catch (err) {
      console.error("Load products error:", err);
      setProducts([]);
      setError(err.message || "Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  // Upload product image
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((currentForm) => ({
        ...currentForm,
        image: reader.result,
      }));
    };

    reader.onerror = () => {
      alert("Failed to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = () => {
    setForm((currentForm) => ({
      ...currentForm,
      image: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add or update product
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      alert("Please fill Product Name, SKU and Category.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);
    const minimumStock = Number(form.minimumStock);

    if (
      (form.price !== "" && (!Number.isFinite(price) || price < 0)) ||
      (form.stock !== "" && (!Number.isFinite(stock) || stock < 0)) ||
      (form.minimumStock !== "" &&
        (!Number.isFinite(minimumStock) || minimumStock < 0))
    ) {
      alert("Price and stock values must be valid non-negative numbers.");
      return;
    }

    const token = getToken();

    if (!token) {
      alert("Please log in to continue.");
      handleUnauthorized();
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          sku: form.sku.trim(),
          category: form.category.trim(),
          price: form.price === "" ? 0 : price,
          stock: form.stock === "" ? 0 : stock,
          minimumStock:
            form.minimumStock === "" ? 0 : minimumStock,
        }),
      });

      const data = await readResponse(response);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save product."
        );
      }

      alert(
        editingId
          ? "Product updated successfully! ✅"
          : "Product added successfully! ✅"
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      console.error("Save product error:", err);
      alert(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  // Start editing
  const editProduct = (product) => {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      minimumStock: product.minimumStock ?? "",
      barcode: product.barcode || "",
      description: product.description || "",
      image: product.image || "",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete product
  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      alert("Please log in to continue.");
      handleUnauthorized();
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
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
          data.error ||
            data.message ||
            "Failed to delete product."
        );
      }

      alert("Product deleted successfully! 🗑️");

      if (editingId === id) {
        resetForm();
      }

      await loadProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      alert(err.message || "Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  const lowStockCount = products.filter(
    (product) =>
      Number(product.stock ?? 0) <=
      Number(product.minimumStock ?? 0)
  ).length;

  return (
    <main className="min-h-screen bg-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-purple-600">
              SMARTSTOCK AI
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Inventory 📦
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your products and monitor stock levels.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            ↻ Refresh Products
          </button>
        </div>

        {/* Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-slate-500">Total Products</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {products.length}
            </p>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-sm text-slate-500">Low Stock Products</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {lowStockCount}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center">
            <p>{error}</p>

            <button
              type="button"
              onClick={loadProducts}
              className="rounded-lg bg-red-100 px-4 py-2 font-semibold hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Add / Edit Product */}
        <section className="glass rounded-3xl p-6 md:p-8">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>

              {editingId && (
                <p className="mt-1 text-sm text-purple-600">
                  You are editing an existing product.
                </p>
              )}
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-5 py-2 font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <Input
              name="name"
              label="Product Name"
              placeholder="e.g. Premium T-Shirt"
              value={form.name}
              onChange={handleChange}
              required
            />

            {/* Image Upload */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Product Image
              </label>

              <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-4">
                {form.image ? (
                  <div>
                    <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl bg-white">
                      <img
                        src={form.image}
                        alt="Product preview"
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-200"
                      >
                        📷 Change Image
                      </button>

                      <button
                        type="button"
                        onClick={removeImage}
                        className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-xl bg-white px-4 py-8 transition hover:bg-purple-50"
                  >
                    <span className="text-5xl">📷</span>

                    <p className="mt-3 font-semibold text-slate-700">
                      Upload Product Image
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      PNG, JPG, JPEG • Max 2MB
                    </p>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <Input
              name="sku"
              label="SKU"
              placeholder="e.g. TS-001"
              value={form.sku}
              onChange={handleChange}
              required
            />

            <Input
              name="category"
              label="Category"
              placeholder="e.g. Clothing"
              value={form.category}
              onChange={handleChange}
              required
            />

            <Input
              name="price"
              label="Price (Rs.)"
              type="number"
              min="0"
              step="0.01"
              placeholder="4500"
              value={form.price}
              onChange={handleChange}
            />

            <Input
              name="stock"
              label="Current Stock"
              type="number"
              min="0"
              step="1"
              placeholder="50"
              value={form.stock}
              onChange={handleChange}
            />

            <Input
              name="minimumStock"
              label="Minimum Stock"
              type="number"
              min="0"
              step="1"
              placeholder="10"
              value={form.minimumStock}
              onChange={handleChange}
            />

            <Input
              name="barcode"
              label="Barcode"
              placeholder="Scan or enter barcode"
              value={form.barcode}
              onChange={handleChange}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                placeholder="Product description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "✓ Update Product"
                  : "+ Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Product List */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Products
            </h2>

            <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
              {products.length} Products
            </span>
          </div>

          {loading ? (
            <div className="glass rounded-2xl p-8 text-center text-slate-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="text-5xl">📦</div>

              <h3 className="mt-4 text-xl font-bold text-slate-800">
                No products yet
              </h3>

              <p className="mt-2 text-slate-500">
                Add your first product using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {(Array.isArray(products) ? products : []).map((product) => {
                const stock = Number(product.stock ?? 0);
                const minimumStock = Number(
                  product.minimumStock ?? 0
                );

                const isLowStock = stock <= minimumStock;

                return (
                  <div
                    key={product._id}
                    className="glass flex flex-col justify-between gap-5 rounded-2xl p-6 md:flex-row md:items-center"
                  >
                    {/* Image and Details */}
                    <div className="flex min-w-0 items-center gap-5">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">📦</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-xl font-bold text-slate-900">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          SKU: {product.sku || "N/A"}
                        </p>

                        <p className="text-sm text-slate-500">
                          Category: {product.category || "N/A"}
                        </p>

                        {product.barcode && (
                          <p className="text-sm text-slate-500">
                            Barcode: {product.barcode}
                          </p>
                        )}

                        {product.description && (
                          <p className="mt-1 break-words text-sm text-slate-500">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price, Stock, Actions */}
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Price</p>
                        <p className="font-bold text-slate-900">
                          Rs.{" "}
                          {Number(product.price || 0).toLocaleString(
                            "en-LK",
                            { minimumFractionDigits: 2 }
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Stock</p>
                        <p
                          className={`font-bold ${
                            isLowStock
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {stock}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isLowStock
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isLowStock ? "Low Stock" : "In Stock"}
                      </span>

                      <button
                        type="button"
                        onClick={() => editProduct(product)}
                        className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProduct(product._id)}
                        disabled={deletingId === product._id}
                        className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                      >
                        {deletingId === product._id
                          ? "Deleting..."
                          : "🗑️ Delete"}
                      </button>
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

function Input({
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  min,
  step,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        min={min}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-purple-100 bg-white/70 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
      />
    </div>
  );
}
