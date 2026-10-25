
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LorryAnimation from "@/components/LorryAnimation";

const API_URL = "https://smart-stock-ai-backend.vercel.app/api/products";
const MIRA_IMAGE = "/Images/mira.png";

const INITIAL_MESSAGE = {
  type: "bot",
  text: "Hello! 👋 I'm Mira, your SmartStock AI Assistant. You can ask me anything about inventory in English,singlish and sinhala",
};

const QUICK_QUESTIONS = [
  "Products කීයක් තියෙනවද?",
  "Mage total stock eka keeyada?",
  "Low stock products monawada?",
  "Out of stock thiyenawada?",
  "Inventory summary eka denna",
  "Highest stock product eka mokakda?",
  "Average stock eka keeyada?",
  "Most expensive product eka mokakda?",
  "Cheapest product eka mokakda?",
  "Total inventory value eka keeyada?",
  "Category report eka denna",
  "Restock karanna one products monawada?",
  "Show all products",
  "Help",
];

export default function AIAssistantPage() {
  const router = useRouter();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakingRef = useRef(false);
  const voiceOutputRef = useRef(false);

  const [products, setProducts] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lorryTrigger, setLorryTrigger] = useState(0);
  const [authChecking, setAuthChecking] = useState(true);

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);

  // Authentication and load inventory
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        router.replace("/login?next=/ai-assistant");
        return;
      }

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) return;

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          router.replace("/login?next=/ai-assistant");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();

        if (cancelled) return;

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        setProducts(productList);
        setError("");
      } catch (err) {
        if (cancelled) return;

        console.error("Product loading error:", err);
        setError(
          "Inventory data load karanna bari una. Backend server eka saha API connection eka check karanna."
        );
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Browser voice capabilities
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    setVoiceSupported(Boolean(SpeechRecognition));

    return () => {
      recognitionRef.current?.stop();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Keep voice preference available to callbacks and timers
  useEffect(() => {
    voiceOutputRef.current = voiceOutput;
  }, [voiceOutput]);

  // Stop speech when navigating away
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // Inventory helpers
  const getStock = (product) =>
    Math.max(
      0,
      Number(product.stock ?? product.quantity ?? 0) || 0
    );

  const getMinimumStock = (product) =>
    Math.max(
      0,
      Number(
        product.minimumStock ??
          product.lowStockThreshold ??
          0
      ) || 0
    );

  const getPrice = (product) =>
    Math.max(0, Number(product.price ?? 0) || 0);

  const getName = (product) =>
    product.name || product.productName || "Unnamed product";

  const totalStock = products.reduce(
    (total, product) => total + getStock(product),
    0
  );

  const lowStockProducts = products.filter((product) => {
    const stock = getStock(product);
    const minimum = getMinimumStock(product);

    return stock > 0 && minimum > 0 && stock <= minimum;
  });

  const outOfStockProducts = products.filter(
    (product) => getStock(product) === 0
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total + getStock(product) * getPrice(product),
    0
  );

  const averageStock = products.length
    ? totalStock / products.length
    : 0;

  const sortedByStock = [...products].sort(
    (a, b) => getStock(b) - getStock(a)
  );

  const sortedByPrice = [...products].sort(
    (a, b) => getPrice(b) - getPrice(a)
  );

  const formatNumber = (value) =>
    Number(value).toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    });

  const formatMoney = (value) =>
    `Rs. ${formatNumber(value)}`;

  const productDescription = (product) =>
    `${getName(product)} — SKU: ${product.sku || "N/A"}, Category: ${
      product.category || "N/A"
    }, Price: ${formatMoney(getPrice(product))}, Stock: ${
      getStock(product)
    } units`;

  // Inventory question and answer engine
  const generateAnswer = useCallback(
    (text) => {
      const original = text.trim();
      const q = original.toLowerCase();

      const has = (...terms) =>
        terms.some((term) => q.includes(term));

      // Greetings
      if (
        /^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/i.test(
          original
        ) ||
        has("ayubowan", "ආයුබෝවන්", "හෙලෝ", "හායි", "kohomada")
      ) {
        return "Hello! 👋 මම Mira. Products, stock, prices සහ inventory reports ගැන මගෙන් අහන්න පුළුවන්. 😊";
      }

      // Help
      if (
        has(
          "help",
          "what can you do",
          "mokakda karanna puluwan",
          "monawada karanna puluwan",
          "උදව්",
          "මොනවද කරන්න පුළුවන්"
        )
      ) {
        return `🤖 Miraට මේ දේවල් ගැන උදව් කරන්න පුළුවන්:

📦 Products ගණන සහ product details
📊 Total, average, highest සහ lowest stock
⚠️ Low-stock සහ out-of-stock alerts
💰 Inventory value සහ price comparisons
🏷️ Category අනුව product counts
🔎 Product name හෝ SKU search
📋 Inventory summary සහ restock list

උදාහරණයක්: "Total inventory value eka keeyada?"`;
      }

      // Product count
      if (
        has(
          "how many products",
          "number of products",
          "total products",
          "products count",
          "products keeyak",
          "products kiyadha",
          "products kiyad",
          "product keeyak",
          "product count",
          "products කීයක්",
          "product කීයක්",
          "භාණ්ඩ කීයක්",
          "භාණ්ඩ ගණන",
          "නිෂ්පාදන කීයක්"
        )
      ) {
        return `📦 Total Products: ${products.length}`;
      }

      // Inventory summary
      if (
        has(
          "inventory summary",
          "inventory status",
          "stock status",
          "inventory eka kohomada",
          "inventory kohomada",
          "summary eka",
          "summary එක",
          "inventory report",
          "stock report",
          "සාරාංශය"
        )
      ) {
        return `📊 Inventory Summary

📦 Total Products: ${products.length}
📊 Total Stock: ${formatNumber(totalStock)} units
📈 Average Stock: ${formatNumber(averageStock)} units per product
⚠️ Low Stock Products: ${lowStockProducts.length}
🚨 Out of Stock Products: ${outOfStockProducts.length}
💰 Estimated Inventory Value: ${formatMoney(inventoryValue)}`;
      }

      // Out of stock
      if (
        has(
          "out of stock",
          "out-of-stock",
          "stock naha",
          "stock na",
          "stock iwara",
          "stock ඉවර",
          "භාණ්ඩ නැහැ",
          "තොග නැහැ",
          "stock නැහැ",
          "zero stock"
        )
      ) {
        if (!outOfStockProducts.length) {
          return "✅ Out-of-stock products නැහැ.";
        }

        return `🚨 Out of Stock Products (${outOfStockProducts.length})\n\n${outOfStockProducts
          .map((p) => `• ${getName(p)} (SKU: ${p.sku || "N/A"})`)
          .join("\n")}`;
      }

      // Low stock
      if (
        has(
          "low stock",
          "low-stock",
          "stock adui",
          "adu stock",
          "stock අඩු",
          "අඩු stock",
          "අඩු තොග",
          "තොග අඩු",
          "low inventory"
        )
      ) {
        if (!lowStockProducts.length) {
          return "✅ දැනට Low Stock products නැහැ. Minimum stock threshold එක set කරලා තිබෙන products පමණක් මෙයට ඇතුළත් වෙනවා.";
        }

        return `⚠️ Low Stock Products (${lowStockProducts.length})\n\n${lowStockProducts
          .map(
            (p) =>
              `• ${getName(p)} — ${getStock(p)} units (Minimum: ${getMinimumStock(p)})`
          )
          .join("\n")}`;
      }

      // Restocking
      if (
        has(
          "restock",
          "reorder",
          "need to order",
          "need ordering",
          "purchase more",
          "restock karanna",
          "order karanna",
          "stock order",
          "replenish",
          "නැවත ඇණවුම්",
          "තොග ගෙන්වන්න"
        )
      ) {
        const needsRestock = products.filter((p) => {
          const min = getMinimumStock(p);
          return min > 0 && getStock(p) <= min;
        });

        if (!needsRestock.length) {
          return "✅ Minimum stock threshold අනුව restock කළ යුතු products හමු වුණේ නැහැ. Product වල minimum stock fields set කරලා තිබෙනවාද බලන්න.";
        }

        return `📦 Restocking List\n\n${needsRestock
          .map((p) => {
            const needed = Math.max(
              0,
              getMinimumStock(p) - getStock(p)
            );

            return `• ${getName(p)} — Current: ${getStock(p)}, Minimum: ${getMinimumStock(p)}, To reach minimum: ${needed} units`;
          })
          .join("\n\n")}`;
      }

      // Highest stock
      if (
        has(
          "highest stock",
          "most stock",
          "maximum stock",
          "most stocked",
          "highest quantity",
          "highest inventory"
        )
      ) {
        if (!products.length) return "📦 Inventory එකේ products නැහැ.";

        const p = sortedByStock[0];

        return `📈 Highest Stock Product\n\n${productDescription(p)}\n\nStock: ${getStock(p)} units`;
      }

      // Lowest stock
      if (
        has(
          "lowest stock",
          "least stock",
          "minimum stock product",
          "lowest quantity",
          "least quantity"
        )
      ) {
        const available = products.filter((p) => getStock(p) > 0);

        if (!available.length) {
          return "⚠️ දැනට positive stock තියෙන products නැහැ.";
        }

        const p = [...available].sort(
          (a, b) => getStock(a) - getStock(b)
        )[0];

        return `📉 Lowest Positive Stock Product\n\n${productDescription(p)}`;
      }

      // Average stock
      if (
        has(
          "average stock",
          "average quantity",
          "mean stock",
          "average inventory",
          "sadharana stock",
          "සාමාන්‍ය stock",
          "සාමාන්‍ය තොග"
        )
      ) {
        return `📊 Average Stock: ${formatNumber(averageStock)} units per product.\n\nCalculation: Total stock (${formatNumber(totalStock)}) ÷ Product count (${products.length || 0}).`;
      }

      // Inventory value
      if (
        has(
          "inventory value",
          "total inventory worth",
          "stock value",
          "value of inventory",
          "total stock value",
          "inventory worth",
          "inventory cost",
          "මුළු inventory වටිනාකම"
        )
      ) {
        return `💰 Estimated Inventory Value: ${formatMoney(inventoryValue)}\n\nCalculation: Sum of (each product's stock × its price).\n\nසටහන: මෙය product price එක selling price ද cost price ද යන්න මත වෙනස් විය හැකි estimate එකක්.`;
      }

      // Most expensive product
      if (
        has(
          "most expensive",
          "highest price",
          "maximum price",
          "costliest product",
          "expensive product",
          "මිල වැඩිම",
          "මිල වැඩි"
        )
      ) {
        if (!products.length) return "📦 Inventory එකේ products නැහැ.";

        const p = sortedByPrice[0];

        return `💎 Most Expensive Product\n\n${getName(p)}\nSKU: ${p.sku || "N/A"}\nPrice: ${formatMoney(getPrice(p))}`;
      }

      // Cheapest product
      if (
        has(
          "cheapest",
          "lowest price",
          "minimum price",
          "least expensive",
          "cheap product",
          "මිල අඩුම",
          "මිල අඩු"
        )
      ) {
        if (!products.length) return "📦 Inventory එකේ products නැහැ.";

        const p = [...products].sort(
          (a, b) => getPrice(a) - getPrice(b)
        )[0];

        return `🪙 Cheapest Product\n\n${getName(p)}\nSKU: ${p.sku || "N/A"}\nPrice: ${formatMoney(getPrice(p))}`;
      }

      // Category report
      if (
        has(
          "category report",
          "categories",
          "category count",
          "category wise",
          "category-wise",
          "by category",
          "category අනුව",
          "වර්ග අනුව"
        )
      ) {
        const counts = {};

        products.forEach((p) => {
          const category = p.category || "Uncategorized";
          counts[category] = (counts[category] || 0) + 1;
        });

        const rows = Object.entries(counts).sort(
          (a, b) => b[1] - a[1]
        );

        if (!rows.length) return "🏷️ Category data නැහැ.";

        return `🏷️ Products by Category\n\n${rows
          .map(([category, count]) => `• ${category}: ${count} products`)
          .join("\n")}`;
      }

      // List all products
      if (
        has(
          "show all products",
          "list all products",
          "all products",
          "product list",
          "products tika",
          "products pennanna",
          "සියලුම products",
          "සියලු products"
        )
      ) {
        if (!products.length) return "📦 Inventory එකේ products නැහැ.";

        return `📦 Product List (${products.length})\n\n${products
          .slice(0, 40)
          .map(
            (p, i) =>
              `${i + 1}. ${getName(p)} — ${getStock(p)} units`
          )
          .join("\n")}${
          products.length > 40
            ? `\n\nShowing 40 of ${products.length} products. Search by name or SKU for details.`
            : ""
        }`;
      }

      // General total stock
      if (
        has(
          "total stock",
          "stock count",
          "how much stock",
          "stock keeyak",
          "stock kiyadha",
          "stock kiyad",
          "stock gana",
          "total quantity",
          "මුළු stock",
          "තොගය කීයක්",
          "තොග කීයක්"
        )
      ) {
        return `📊 Total Stock: ${formatNumber(totalStock)} units`;
      }

      // Product lookup by name or SKU
      const normalizedQuery = q
        .replace(
          /\b(what is|how many|tell me|show me|find|search|details|detail|stock|quantity|price|about|product|sku|my|the|please|can you)\b/g,
          " "
        )
        .replace(
          /(mage|eka|keeyada|kiyada|kiyadha|gana|mokakda|pennanna|denna)/g,
          " "
        )
        .replace(/[?.,!]/g, " ")
        .trim();

      const foundProduct = products.find((p) => {
        const name = String(getName(p)).toLowerCase();
        const sku = String(p.sku || "").toLowerCase();

        return (
          (name.length > 0 && q.includes(name)) ||
          (sku.length > 0 && q.includes(sku)) ||
          (normalizedQuery.length >= 2 &&
            (name.includes(normalizedQuery) ||
              sku.includes(normalizedQuery)))
        );
      });

      if (foundProduct) {
        const stock = getStock(foundProduct);
        const minimum = getMinimumStock(foundProduct);

        let status = "✅ Stock is healthy.";

        if (stock === 0) {
          status = "🚨 This product is Out of Stock.";
        } else if (minimum > 0 && stock <= minimum) {
          status = "⚠️ This product is Low Stock.";
        }

        return `📦 ${getName(foundProduct)}

SKU: ${foundProduct.sku || "N/A"}
Category: ${foundProduct.category || "N/A"}
Price: ${formatMoney(getPrice(foundProduct))}
Stock: ${stock} units
Minimum Stock: ${minimum} units

${status}`;
      }

      // Default response
      return `🤔 Sorry, මට ඒ ප්‍රශ්නය තේරුණේ නැහැ.

ඔයාට මෙහෙම අහන්න පුළුවන්:

• "Products කීයක් තියෙනවද?"
• "Total stock eka keeyada?"
• "Highest stock product eka mokakda?"
• "Average stock eka keeyada?"
• "Low stock products monawada?"
• "Restock karanna one products monawada?"
• "Total inventory value eka keeyada?"
• "Most expensive product eka mokakda?"
• "Category report eka denna"
• "Show all products"`;
    },
    [
      products,
      totalStock,
      averageStock,
      inventoryValue,
      lowStockProducts,
      outOfStockProducts,
    ]
  );

  // Voice output
  const speakText = useCallback((text) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setVoiceError("This browser does not support voice output.");
      return;
    }

    const cleanText = String(text || "")
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
      .replace(/[\u{2600}-\u{27BF}]/gu, "")
      .trim();

    if (!cleanText) return;

    const synth = window.speechSynthesis;

    synth.cancel();
    speakingRef.current = false;
    setVoiceError("");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();

const femaleVoiceNames =
  /samantha|zira|karen|moira|tessa|susan|aria|jenny|ava|serena|victoria|allison|female|woman/i;

const femaleVoice = voices.find(
  (voice) =>
    voice.lang.toLowerCase().startsWith("en") &&
    femaleVoiceNames.test(voice.name)
);

utterance.lang = "en-US";

if (femaleVoice) {
  utterance.voice = femaleVoice;
  utterance.lang = femaleVoice.lang;
}

utterance.rate = 0.9;
utterance.pitch = 1.1;
utterance.volume = 1;
    utterance.onstart = () => {
      speakingRef.current = true;
    };

    utterance.onend = () => {
      speakingRef.current = false;
    };

    utterance.onerror = (event) => {
      speakingRef.current = false;

      if (
        event.error !== "canceled" &&
        event.error !== "interrupted"
      ) {
        setVoiceError(
          "Voice playback failed. Browser voice settings and volume check කරන්න."
        );
      }
    };

    synth.speak(utterance);
  }, []);

  // Start microphone
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Voice input support නැහැ. Chrome browser එකෙන් උත්සාහ කරන්න."
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setVoiceError("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }

      setQuestion(transcript.trim());
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (event.error === "not-allowed") {
        setVoiceError(
          "Microphone permission deny වෙලා. Browser settings වලින් microphone access allow කරන්න."
        );
      } else if (event.error === "no-speech") {
        setVoiceError(
          "කතා කරන හඬක් හමු වුණේ නැහැ. නැවත උත්සාහ කරන්න."
        );
      } else {
        setVoiceError(
          `Voice input error: ${event.error}. Browser microphone settings check කරන්න.`
        );
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start error:", err);
      setListening(false);
      setVoiceError(
        "Microphone start කරන්න බැරි වුණා. නැවත උත්සාහ කරන්න."
      );
    }
  };

  // Send chat message
  const handleSend = (event) => {
    event?.preventDefault();

    const userQuestion = question.trim();

    if (!userQuestion || loading || authChecking) return;

    recognitionRef.current?.stop();
    setListening(false);
    setVoiceError("");

    setMessages((previous) => [
      ...previous,
      { type: "user", text: userQuestion },
    ]);

    setLorryTrigger((previous) => previous + 1);
    setQuestion("");
    setLoading(true);

    window.setTimeout(() => {
      const answer = generateAnswer(userQuestion);

      setMessages((previous) => [
        ...previous,
        { type: "bot", text: answer },
      ]);

      setLorryTrigger((previous) => previous + 1);
      setLoading(false);

      // Play the reply when voice output is enabled.
      if (voiceOutputRef.current) {
        speakText(answer);
      }
    }, 350);
  };

  // Clear chat
  const handleClearChat = () => {
    if (loading) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    recognitionRef.current?.stop();

    speakingRef.current = false;
    setListening(false);
    setVoiceError("");
    setMessages([INITIAL_MESSAGE]);
    setQuestion("");
  };

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <img
            src={MIRA_IMAGE}
            alt="Mira"
            className="mx-auto h-20 w-20 rounded-full border-2 border-violet-400 object-cover"
          />
          <p className="mt-4 font-semibold">
            Loading Mira Assistant...
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Checking your login session
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              SmartStock AI
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Mira · Inventory Assistant
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClearChat}
              disabled={loading}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:bg-white/10 disabled:opacity-50"
            >
              Clear Chat
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold transition hover:bg-violet-500"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-10">
        {/* CHAT PANEL */}
        <section className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/10 p-4 sm:p-5">
            <img
              src={MIRA_IMAGE}
              alt="Mira AI Assistant"
              className="h-12 w-12 rounded-full border-2 border-violet-400 object-cover"
            />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Chat with Mira</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ready to help with your inventory
              </p>
            </div>

            <span className="hidden rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-200 sm:inline-block">
              AI Assistant
            </span>
          </div>

          {/* LORRY ANIMATION */}
          <div className="border-b border-white/10 p-3">
            <LorryAnimation
              trigger={lorryTrigger}
              stock={totalStock}
            />
          </div>

          {/* CHAT MESSAGES */}
          <div className="h-[430px] space-y-5 overflow-y-auto p-4 sm:h-[500px] sm:p-6">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.type}`}
                className={`flex items-end gap-2 ${
                  message.type === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.type === "bot" && (
                  <img
                    src={MIRA_IMAGE}
                    alt="Mira"
                    className="h-8 w-8 shrink-0 rounded-full border border-violet-400/60 object-cover"
                  />
                )}

                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${
                    message.type === "user"
                      ? "rounded-br-sm bg-violet-600 text-white"
                      : "rounded-bl-sm border border-white/5 bg-slate-800 text-slate-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2">
                <img
                  src={MIRA_IMAGE}
                  alt="Mira"
                  className="h-8 w-8 rounded-full border border-violet-400/60 object-cover"
                />

                <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-sm text-slate-300">
                  Mira is thinking...
                  <span className="ml-2 inline-flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce [animation-delay:120ms]">
                      •
                    </span>
                    <span className="animate-bounce [animation-delay:240ms]">
                      •
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* QUICK QUESTIONS AND VOICE */}
          <div className="border-t border-white/10 p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quick Questions
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuestion(item)}
                  className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-left text-xs text-violet-100 transition hover:border-violet-300 hover:bg-violet-500/20"
                >
                  {item}
                </button>
              ))}
            </div>

            {/* VOICE STATUS */}
            {voiceError && (
              <p
                role="status"
                className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-200"
              >
                {voiceError}
              </p>
            )}

            {!voiceSupported && (
              <p className="mb-3 text-xs text-slate-400">
                Voice input may not be available in this browser. Try Chrome.
              </p>
            )}

            {/* VOICE CONTROLS */}
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startListening}
                disabled={!voiceSupported || loading || authChecking}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  listening
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "border border-white/10 bg-slate-800 hover:bg-slate-700"
                }`}
                aria-label={
                  listening ? "Stop voice input" : "Start voice input"
                }
              >
                {listening ? "⏹ Stop Listening" : "🎤 Speak"}
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !voiceOutput;

                  setVoiceOutput(next);
                  voiceOutputRef.current = next;

                  if (!next) {
                    window.speechSynthesis?.cancel();
                    speakingRef.current = false;
                    setVoiceError("");
                    return;
                  }

                  setVoiceError("");

                  // Speak the latest Mira message when Voice On is clicked.
                  const lastBotMessage = [...messages]
                    .reverse()
                    .find((message) => message.type === "bot");

                  if (lastBotMessage) {
                    speakText(lastBotMessage.text);
                  }
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  voiceOutput
                    ? "bg-violet-600 hover:bg-violet-500"
                    : "border border-white/10 bg-slate-800 hover:bg-slate-700"
                }`}
                aria-pressed={voiceOutput}
              >
                {voiceOutput ? "🔊 Voice On" : "🔇 Voice Off"}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  speakingRef.current = false;
                }}
                className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm transition hover:bg-slate-700"
              >
                Stop Audio
              </button>
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={
                  listening
                    ? "Listening... speak now"
                    : "Ask or speak about your inventory..."
                }
                aria-label="Ask Mira a question"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
              />

              <button
                type="submit"
                disabled={!question.trim() || loading || authChecking}
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send ↑
              </button>
            </form>

            <p className="mt-3 text-center text-xs text-slate-500">
              English · Sinhala · Singlish
            </p>
          </div>
        </section>

        {/* MIRA PANEL */}
        <aside className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-b from-violet-950 via-slate-900 to-slate-900 p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex items-center justify-between">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                ● Online
              </span>
              <span className="text-xs text-slate-400">MIRA AI</span>
            </div>

            <div className="mira-float relative mx-auto max-w-[280px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-800 shadow-2xl shadow-violet-950/40">
              <img
                src={MIRA_IMAGE}
                alt="Mira, your SmartStock AI assistant"
                className="aspect-[3/4] w-full object-cover object-center"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent p-5 pt-16">
                <p className="text-2xl font-bold">Hi, I’m Mira!</p>
                <p className="mt-1 text-sm text-slate-200">
                  Your smart inventory companion.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold">Mira</h2>
              <p className="mt-1 text-sm text-slate-400">
                SmartStock AI Assistant
              </p>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-300">
                Ask me about product quantities, prices, total stock,
                low-stock alerts, restocking and inventory reports.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-400">Products</p>
                <p className="mt-2 text-2xl font-bold">
                  {products.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-400">Total units</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(totalStock)}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                <p className="text-xs text-amber-200">Low stock</p>
                <p className="mt-2 text-2xl font-bold text-amber-100">
                  {lowStockProducts.length}
                </p>
              </div>

              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4">
                <p className="text-xs text-rose-200">Out of stock</p>
                <p className="mt-2 text-2xl font-bold text-rose-100">
                  {outOfStockProducts.length}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-violet-400/20 bg-slate-950/50 p-4">
              <p className="text-xs text-slate-400">
                Estimated inventory value
              </p>
              <p className="mt-2 text-xl font-bold">
                {formatMoney(inventoryValue)}
              </p>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-200">
                {error}
              </p>
            )}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .mira-float {
          animation: miraFloat 4s ease-in-out infinite;
        }

        @keyframes miraFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mira-float {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
