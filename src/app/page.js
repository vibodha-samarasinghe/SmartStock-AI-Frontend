"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function Home() {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Dashboard Home button එකෙන් ආවොත් Main Homepage එක පෙන්වන්න
  useEffect(() => {
    if (sessionStorage.getItem("openMainHome") === "true") {
      setStarted(true);
      sessionStorage.removeItem("openMainHome");
    }
  }, []);

  const categories = [
    {
      id: "clothing",
      title: "Clothing",
      description: "Manage clothes, fashion items and accessories",
      image: "/Images/Clothing.jpg",
      color: "from-purple-50 to-violet-100",
      border: "border-purple-300",
      accent: "bg-purple-600",
    },
    {
      id: "grocery",
      title: "Grocery",
      description: "Manage food, beverages and daily essentials",
      image: "/Images/Grocery.jpeg",
      color: "from-green-50 to-emerald-100",
      border: "border-emerald-300",
      accent: "bg-emerald-500",
    },
    {
      id: "electronics",
      title: "Electronics",
      description: "Manage phones, computers and electronic products",
      image: "/Images/Electronic.jpeg",
      color: "from-blue-50 to-sky-100",
      border: "border-blue-300",
      accent: "bg-blue-500",
    },
    {
      id: "cosmetics",
      title: "Cosmetics",
      description: "Manage beauty, skincare and personal care products",
      image: "/Images/Cosmatics.jpg",
      color: "from-pink-50 to-rose-100",
      border: "border-pink-300",
      accent: "bg-pink-500",
    },
  ];

  // Reusable logo button
  const BrandLogo = ({ width = "w-52" }) => (
    <button
      type="button"
      onClick={() => {
        setStarted(false);
        setSelectedCategory(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      aria-label="SmartStock AI home"
      className="inline-flex shrink-0 text-left"
    >
      <Logo className={width} />
    </button>
  );

  // WELCOME PAGE
  if (!started) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-purple-50 to-purple-200 text-slate-900">
        <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl" />

        {/* NAVIGATION */}
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-10">
          <BrandLogo width="w-52" />

          <button
            onClick={() => router.push("/login")}
            className="rounded-xl border border-purple-200 bg-white/80 px-5 py-2.5 font-semibold text-purple-700 transition hover:bg-purple-100"
          >
            Login
          </button>
        </nav>

        {/* WELCOME HERO */}
        <section className="relative z-10 mx-auto grid min-h-[70vh] max-w-7xl items-center gap-6 px-6 py-8 md:grid-cols-2 lg:px-10">
          <div className="order-2 md:order-1">
            <span className="inline-flex rounded-full border border-purple-300 bg-white/80 px-5 py-3 text-base font-bold tracking-wide text-purple-800 shadow-md sm:text-lg">
              AI-Powered Inventory Management
            </span>

            <h2 className="mt-7 text-5xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Smart Inventory.
              <span className="mt-3 block bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                Smarter Business.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
              Manage your inventory, track sales, monitor stock levels,
              and make smarter business decisions with{" "}
              <span className="font-extrabold text-purple-700">
                SmartStock AI.
              </span>
            </p>

            <button
              onClick={() => setStarted(true)}
              className="mt-7 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-8 py-4 font-bold text-white shadow-lg shadow-purple-300/50 transition hover:-translate-y-1 hover:from-purple-700 hover:to-violet-800"
            >
              Get Started <span className="ml-2">→</span>
            </button>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span>✓ Easy stock management</span>
              <span>✓ Smart business insights</span>
            </div>
          </div>

          {/* MIRA IMAGE */}
          <div className="relative order-1 flex justify-center md:order-2">
            <div className="pointer-events-none absolute inset-10 rounded-full bg-purple-300/30 blur-3xl" />

            <div className="relative w-full max-w-2xl">
              <div className="absolute -left-2 top-8 z-10 rounded-2xl border border-purple-100 bg-white/95 p-4 shadow-xl sm:-left-4">
                <p className="font-bold text-purple-700">
                  Hi! I&apos;m Mira
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Your AI Assistant
                </p>
              </div>

              <img
                src="/Images/Mira1 .png"
                alt="Mira AI Assistant"
                className="relative mx-auto max-h-[460px] w-full object-contain drop-shadow-[0_0_30px_rgba(216,180,254,0.5)]"
              />

              <div className="absolute bottom-0 right-0 z-10 rounded-2xl border border-purple-100 bg-white/95 p-4 shadow-xl">
                <p className="font-bold text-slate-800">
                  Smart Inventory
                </p>
                <p className="mt-1 text-xs text-purple-600">
                  Powered by SmartStock AI
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-purple-200/70 px-6 py-5 text-center text-sm text-slate-500">
          © 2026 SmartStock AI. Smart Inventory • Smarter Decisions
        </footer>
      </main>
    );
  }

  // HOMEPAGE AFTER GET STARTED
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-purple-50 to-purple-100 text-slate-800">
      {/* BACKGROUND LIGHTING */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-purple-300/15 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-400/15 blur-3xl" />
      </div>

      {/* NAVIGATION */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <BrandLogo width="w-52" />

        <div className="hidden items-center gap-6 md:flex">
          <button
            onClick={() =>
              document.getElementById("home")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="text-sm font-medium text-slate-600 hover:text-purple-600"
          >
            Home
          </button>

          <button
            onClick={() =>
              document.getElementById("business")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="text-sm font-medium text-slate-600 hover:text-purple-600"
          >
            Business
          </button>

          <button
            onClick={() =>
              document.getElementById("features")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="text-sm font-medium text-slate-600 hover:text-purple-600"
          >
            Features
          </button>

          <button
            onClick={() => router.push("/login")}
            className="rounded-xl border border-purple-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
          >
            Login
          </button>
        </div>

        <button
          onClick={() =>
            document.getElementById("business")?.scrollIntoView({
              behavior: "smooth",
            })
          }
          className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 md:hidden"
        >
          Categories
        </button>
      </nav>

      {/* HERO SECTION */}
      <section
        id="home"
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-4 overflow-hidden rounded-[1.5rem] border border-purple-200 bg-gradient-to-br from-white via-purple-50 to-violet-100 px-6 py-6 shadow-xl shadow-purple-200/30 md:grid-cols-2 lg:px-8 lg:py-8"
      >
        <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-fuchsia-300/20 blur-[80px]" />
        <div className="pointer-events-none absolute right-0 top-10 h-64 w-64 rounded-full bg-purple-300/20 blur-[85px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-300/15 blur-[70px]" />

        <div className="relative z-10 order-2 py-4 md:order-1">
          <span className="inline-flex rounded-full border border-purple-300 bg-white/85 px-5 py-2.5 text-base font-extrabold tracking-wide text-purple-800 shadow-md sm:text-lg">
            AI-Powered Inventory Management
          </span>

          <h2 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Smart Inventory.
            <span className="mt-3 block bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              Smarter Business.
            </span>
          </h2>

          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
            Manage your inventory, track sales, monitor stock levels,
            and make smarter business decisions with{" "}
            <span className="font-extrabold text-purple-700">
              SmartStock AI.
            </span>
          </p>

          <button
            onClick={() =>
              document.getElementById("business")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-7 py-3.5 font-bold text-white shadow-lg shadow-purple-300/40 transition hover:-translate-y-1 hover:from-purple-700 hover:to-violet-800"
          >
            Choose Your Business <span className="ml-2">→</span>
          </button>
        </div>

        {/* MIRA IMAGE */}
        <div className="relative z-10 order-1 flex min-h-[300px] items-center justify-center overflow-visible md:order-2 md:min-h-[420px]">
          <div className="pointer-events-none absolute h-56 w-72 rounded-full bg-fuchsia-300/25 blur-[65px] sm:h-64 sm:w-96" />

          <img
            src="/Images/mira2.png"
            alt="Mira AI Assistant"
            className="relative z-10 h-auto w-full max-w-2xl scale-100 object-contain drop-shadow-[0_0_30px_rgba(216,180,254,0.55)]"
          />
        </div>
      </section>

      {/* BUSINESS CATEGORY CARDS */}
      <section
        id="business"
        className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-10"
      >
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">
            Find Your Category
          </p>

          <h3 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Choose Your Business
          </h3>

          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Select your business type to manage your products and inventory
            more efficiently.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {categories.map((category) => {
            const isSelected = selectedCategory?.id === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`group relative grid min-h-[260px] grid-cols-1 items-center overflow-hidden rounded-3xl border bg-gradient-to-br p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:grid-cols-[42%_58%] sm:p-7 ${category.color} ${category.border} ${
                  isSelected
                    ? "ring-2 ring-purple-500 shadow-xl"
                    : "shadow-md shadow-purple-100/50"
                }`}
              >
                <div className="relative flex h-44 items-center justify-center sm:h-48">
                  <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-purple-200 bg-white shadow-md transition duration-300 group-hover:scale-105 sm:h-40 sm:w-40">
                    <img
                      src={category.image}
                      alt={category.title}
                      loading="lazy"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                </div>

                <div className="relative flex h-full flex-col justify-center sm:pl-4">
                  <h4 className="text-2xl font-extrabold text-slate-900">
                    {category.title}
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {category.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {isSelected ? "Selected" : "Explore category"}
                    </span>

                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-md transition group-hover:translate-x-1 ${category.accent}`}
                    >
                      →
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-700 shadow-sm">
                    Selected ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedCategory && (
          <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-purple-200 bg-white/80 p-7 text-center shadow-lg">
            <p className="text-sm font-medium text-purple-600">
              Selected business
            </p>

            <h4 className="mt-2 text-2xl font-extrabold text-slate-900">
              {selectedCategory.title}
            </h4>

            <p className="mt-2 text-sm text-slate-500">
              Continue to set up SmartStock AI for your business.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/register?category=${encodeURIComponent(
                    selectedCategory.title
                  )}`
                )
              }
              className="mt-5 rounded-xl bg-purple-600 px-8 py-3.5 font-semibold text-white shadow-md transition hover:bg-purple-700"
            >
              Continue →
            </button>
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-10"
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">
            Everything In One Place
          </p>

          <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
            Powerful Features
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* AI ASSISTANT */}
          <button
            onClick={() => router.push("/ai-assistant")}
            className="group rounded-3xl border border-purple-100 bg-white/80 p-7 text-left shadow-md transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-600 group-hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
                <path d="M12 3a7 7 0 0 0-4 12.75V19h8v-3.25A7 7 0 0 0 12 3Z" />
                <path d="M9 22h6M9 19h6M9 10h.01M15 10h.01M9.5 13a4 4 0 0 0 5 0" />
              </svg>
            </div>

            <h4 className="mt-5 text-xl font-bold text-slate-900">
              AI Assistant
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ask Mira AI questions and get help with inventory management.
            </p>

            <p className="mt-5 text-sm font-bold text-purple-600">
              Open AI Assistant →
            </p>
          </button>

          {/* REPORTS */}
          <button
            onClick={() => router.push("/reports")}
            className="group rounded-3xl border border-purple-100 bg-white/80 p-7 text-left shadow-md transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-600 group-hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
                <path d="M4 19V5M4 19h17" />
                <path d="M8 15v-4M13 15V7M18 15V3" />
              </svg>
            </div>

            <h4 className="mt-5 text-xl font-bold text-slate-900">
              Smart Analytics
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review inventory performance, sales information and reports.
            </p>

            <p className="mt-5 text-sm font-bold text-purple-600">
              View Reports →
            </p>
          </button>

          {/* ALERTS */}
          <button
            onClick={() => router.push("/alerts")}
            className="group rounded-3xl border border-purple-100 bg-white/80 p-7 text-left shadow-md transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-600 group-hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
                <path d="M10 21h4" />
              </svg>
            </div>

            <h4 className="mt-5 text-xl font-bold text-slate-900">
              Smart Alerts
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Check low-stock notifications and important inventory updates.
            </p>

            <p className="mt-5 text-sm font-bold text-purple-600">
              View Alerts →
            </p>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 mt-8 border-t border-purple-100 bg-white/50 px-6 py-7 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
          <p>© 2026 SmartStock AI. All rights reserved.</p>

          <button
            onClick={() => {
              setStarted(false);
              setSelectedCategory(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-semibold text-purple-600 transition hover:text-purple-800"
          >
            Back to Welcome ↑
          </button>

          <p>Smart Inventory • Smarter Decisions</p>
        </div>
      </footer>
    </main>
  );
}