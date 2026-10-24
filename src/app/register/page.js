"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get("category") || "Business";

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.shopName.trim() ||
      !formData.ownerName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://smart-stock-ai-backend.vercel.app/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shopName: formData.shopName,
            ownerName: formData.ownerName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            password: formData.password,
            category,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      console.log("Registration successful:", data);
      setSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        "Cannot connect to the server. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.push("/");
  };

  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100 text-slate-800">
      {/* Background Decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-purple-300/20 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <button onClick={goBack} className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 text-2xl shadow-lg shadow-purple-300/40">
            📦
          </div>

          <div className="text-left">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              SmartStock <span className="text-purple-600">AI</span>
            </h1>
            <p className="text-xs text-slate-500">
              Smart Inventory Management
            </p>
          </div>
        </button>

        <button
          onClick={goToLogin}
          className="rounded-xl border border-purple-200 bg-white/60 px-5 py-2.5 text-sm font-semibold text-purple-700 shadow-sm backdrop-blur-md transition hover:bg-purple-50"
        >
          Already have an account?
        </button>
      </header>

      {/* Main Content */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-8 lg:pt-12">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl shadow-sm">
            🏪
          </div>

          <h2 className="mt-5 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Register Your Shop
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Create your SmartStock AI account and start managing your
            business inventory smarter.
          </p>

          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-purple-700 shadow-sm backdrop-blur-xl">
            <span>Business Type:</span>
            <span className="font-bold">{category}</span>
          </div>
        </div>

        {/* Registration Card */}
        <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-2xl shadow-purple-100/60 backdrop-blur-xl sm:p-8 lg:p-10">
          {!success ? (
            <form onSubmit={handleSubmit}>
              {/* Shop Information */}
              <div>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-900">
                    Shop Information
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Tell us about your business.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      placeholder="Enter your shop name"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Enter owner name"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="07XXXXXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter your city"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Shop Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter your shop address"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>
              </div>

              <div className="my-8 border-t border-slate-200" />

              {/* Password Section */}
              <div>
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-slate-900">
                    Create Your Password
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Use this password to securely access your account.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-300/40 transition hover:from-purple-700 hover:to-purple-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Shop Account →"}
              </button>

              <button
                type="button"
                onClick={goBack}
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white/70 px-6 py-3.5 font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                ← Back to Business Selection
              </button>
            </form>
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
                ✓
              </div>

              <h3 className="mt-6 text-2xl font-bold text-slate-900">
                Shop Registered Successfully!
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Your {category} shop has been successfully registered with
                SmartStock AI.
              </p>

              <div className="mx-auto mt-6 max-w-md rounded-2xl bg-purple-50 p-5 text-left">
                <p className="text-sm text-slate-500">Shop Name</p>
                <p className="mt-1 font-bold text-slate-900">
                  {formData.shopName}
                </p>

                <p className="mt-4 text-sm text-slate-500">Business Type</p>
                <p className="mt-1 font-bold text-purple-700">{category}</p>

                <p className="mt-4 text-sm text-slate-500">Email</p>
                <p className="mt-1 font-bold text-slate-900">
                  {formData.email}
                </p>
              </div>

              <button
                onClick={goToLogin}
                className="mt-8 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-3.5 font-bold text-white shadow-lg shadow-purple-300/40 transition hover:from-purple-700 hover:to-purple-800"
              >
                Continue to Login →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-100 bg-white/30 px-6 py-6 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl text-center text-sm text-slate-500">
          © 2026 SmartStock AI. Smart Inventory • Smarter Decisions
        </div>
      </footer>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-purple-50 text-purple-700">
          Loading registration...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
