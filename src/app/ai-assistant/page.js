
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LorryAnimation from "@/components/LorryAnimation";

const BACKEND_URL = "https://smart-stock-ai-backend.vercel.app";
const MIRA_IMAGE = "/Images/Mira.png";

const INITIAL_MESSAGE = {
  type: "bot",
  text: "Hello! 👋 I'm Mira, your SmartStock AI Assistant. Ask me about your inventory in English, Sinhala or Singlish.",
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
  const audioRef = useRef(null);
  const voiceOutputRef = useRef(false);
  const voiceRequestIdRef = useRef(0);

  const [products, setProducts] = useState([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [lorryTrigger, setLorryTrigger] = useState(0);

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

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

  const formatNumber = (number) =>
    Number(number).toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    });

  const formatMoney = (number) =>
    `Rs. ${formatNumber(number)}`;

  const totalStock = products.reduce(
    (sum, product) => sum + getStock(product),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      getStock(product) > 0 &&
      getMinimumStock(product) > 0 &&
      getStock(product) <= getMinimumStock(product)
  );

  const outOfStockProducts = products.filter(
    (product) => getStock(product) === 0
  );

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum + getStock(product) * getPrice(product),
    0
  );

  // Load the authenticated user's products.
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const token = getToken();

      if (!token) {
        router.replace("/login?next=/ai-assistant");
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (cancelled) return;

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          router.replace("/login?next=/ai-assistant");
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Products API failed (${response.status})`
          );
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        if (!cancelled) {
          setProducts(list);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Product loading error:", err);
          setError(
            err.message ||
              "Inventory data load karanna bari una."
          );
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Configure microphone input.
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    setVoiceSupported(Boolean(SpeechRecognition));

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setVoiceError("");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript || "";

      if (transcript.trim()) {
        setQuestion(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(
        event.error === "not-allowed"
          ? "Microphone permission eka allow karanna."
          : `Microphone error: ${event.error}`
      );

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;

      try {
        recognition.stop();
      } catch {}

      recognitionRef.current = null;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    voiceOutputRef.current = voiceOutput;
  }, [voiceOutput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // Speak text using the separate Mira voice endpoint.
  
const speakText = useCallback(async (text) => {
  const cleanText = String(text || "").trim();

  // Never request audio when voice is OFF.
  if (!cleanText || !voiceOutputRef.current) return;

  const requestId = ++voiceRequestIdRef.current;
  const token = getToken();

  if (!token) {
    if (voiceOutputRef.current) {
      setVoiceError("Please log in to use Mira voice.");
    }
    return;
  }

  let audioUrl = null;

  try {
    setVoiceError("");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const response = await fetch(
      `${BACKEND_URL}/api/mira/voice/speak`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: cleanText.slice(0, 1500),
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    // Ignore results from an old request or when voice was switched OFF.
    if (
      !voiceOutputRef.current ||
      requestId !== voiceRequestIdRef.current
    ) {
      return;
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error?.message ||
        (typeof data.error === "string" ? data.error : "") ||
        `Voice request failed (${response.status})`
      );
    }

    if (!data.audio) {
      throw new Error("Mira returned no audio data.");
    }

    const binary = window.atob(data.audio);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }

    const blob = new Blob([bytes], {
      type: data.mimeType || "audio/wav",
    });

    audioUrl = URL.createObjectURL(blob);

    // Check again before playing.
    if (
      !voiceOutputRef.current ||
      requestId !== voiceRequestIdRef.current
    ) {
      URL.revokeObjectURL(audioUrl);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);

      if (audioRef.current === audio) {
        audioRef.current = null;
      }

      if (
        voiceOutputRef.current &&
        requestId === voiceRequestIdRef.current
      ) {
        setVoiceError("Mira voice audio could not be played.");
      }
    };

    await audio.play();
  } catch (err) {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Do not show an error for a request that is no longer relevant.
    if (
      !voiceOutputRef.current ||
      requestId !== voiceRequestIdRef.current
    ) {
      return;
    }

    console.error("Mira voice error:", err);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setVoiceError(
      "Mira voice is temporarily unavailable. Please try again later."
    );
  }
}, []);
 
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setVoiceError(
        "Voice input is not supported. Try Chrome."
      );
      return;
    }

    try {
      setVoiceError("");
      recognitionRef.current.start();
    } catch (err) {
      if (err.name !== "InvalidStateError") {
        setVoiceError("Could not start the microphone.");
      }
    }
  }, []);

  // Send a question to Mira's chat endpoint.
  const handleSend = async (event) => {
    event?.preventDefault();

    const userQuestion = question.trim();

    if (!userQuestion || loading || authChecking) return;

    const token = getToken();

    if (!token) {
      router.replace("/login?next=/ai-assistant");
      return;
    }

    recognitionRef.current?.stop();

    setListening(false);
    setVoiceError("");
    setError("");
    setQuestion("");

    setMessages((previous) => [
      ...previous,
      {
        type: "user",
        text: userQuestion,
      },
    ]);

    setLorryTrigger((previous) => previous + 1);
    setLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/mira/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: userQuestion,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      console.log("Mira API URL:", response.url);
      console.log("Mira API status:", response.status);

      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ||
              data.message ||
              `Request failed (${response.status})`;

        throw new Error(message);
      }

      if (
        typeof data.answer !== "string" ||
        !data.answer.trim()
      ) {
        throw new Error("Mira returned an empty response.");
      }

      const answer = data.answer.trim();

      setMessages((previous) => [
        ...previous,
        {
          type: "bot",
          text: answer,
        },
      ]);

      setLorryTrigger((previous) => previous + 1);

      if (voiceOutputRef.current) {
        void speakText(answer);
      }
    } catch (err) {
      console.error("Mira request failed:", err);

      setError(
        err.message ||
          "Mira could not answer. Check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (loading) return;

    recognitionRef.current?.stop();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setListening(false);
    setVoiceError("");
    setError("");
    setQuestion("");
    setMessages([INITIAL_MESSAGE]);
  };

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-violet-50 px-4 text-slate-900">
        <div className="text-center">
          <img
            src={MIRA_IMAGE}
            alt="Mira"
            className="mx-auto h-20 w-20 rounded-full border-2 border-violet-400 object-cover"
          />

          <p className="mt-4 font-semibold">
            Loading Mira Assistant...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Checking your login session
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-violet-50 text-slate-900">
      <header className="border-b border-violet-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-violet-800 sm:text-2xl">
              SmartStock AI
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Mira · Inventory Assistant
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleClearChat}
              disabled={loading}
              className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
            >
              Clear Chat
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-10">
        <section className="min-w-0 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/60">
          <div className="flex items-center gap-3 border-b border-violet-100 p-4 sm:p-5">
            <img
              src={MIRA_IMAGE}
              alt="Mira AI Assistant"
              className="h-12 w-12 rounded-full border-2 border-violet-400 object-cover"
            />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Chat with Mira</h2>

              <p className="mt-1 text-xs text-emerald-600">
                ● Ready to help with your inventory
              </p>
            </div>

            <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 sm:inline-block">
              AI Assistant
            </span>
          </div>

          <div className="border-b border-violet-100 bg-violet-50/50 p-3">
            <LorryAnimation
              trigger={lorryTrigger}
              stock={totalStock}
            />
          </div>

          <div className="h-[430px] space-y-5 overflow-y-auto bg-white p-4 sm:h-[500px] sm:p-6">
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
                    className="h-8 w-8 shrink-0 rounded-full border border-violet-300 object-cover"
                  />
                )}

                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[80%] ${
                    message.type === "user"
                      ? "rounded-br-sm bg-violet-600 text-white"
                      : "rounded-bl-sm border border-violet-100 bg-violet-50 text-slate-700"
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
                  className="h-8 w-8 rounded-full border border-violet-300 object-cover"
                />

                <div className="rounded-2xl rounded-bl-sm border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-slate-600">
                  Mira is thinking...
                  <span className="ml-2 animate-pulse text-violet-600">
                    • • •
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-violet-100 bg-white p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quick Questions
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuestion(item)}
                  disabled={loading}
                  className="rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-left text-xs font-medium text-violet-700 hover:border-violet-400 hover:bg-violet-100 disabled:opacity-50"
                >
                  {item}
                </button>
              ))}
            </div>

            {error && (
              <p
                role="alert"
                className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
              >
                {error}
              </p>
            )}

            {voiceError && (
              <p
                role="status"
                className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
              >
                {voiceError}
              </p>
            )}

            {!voiceSupported && (
              <p className="mb-3 text-xs text-slate-500">
                Microphone input is unavailable in this browser. Try Chrome.
              </p>
            )}

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startListening}
                disabled={!voiceSupported || loading}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 ${
                  listening
                    ? "bg-rose-600 text-white"
                    : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                }`}
              >
                {listening ? "⏹ Stop Listening" : "🎤 Speak"}
              </button>

              <button
                type="button"
                
onClick={() => {
  const next = !voiceOutput;

  setVoiceOutput(next);
  voiceOutputRef.current = next;

  // Invalidate any previous TTS response.
  voiceRequestIdRef.current += 1;

  if (!next) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setVoiceError("");
    return;
  }

  const lastBotMessage = [...messages]
    .reverse()
    .find((message) => message.type === "bot");

  if (lastBotMessage) {
    void speakText(lastBotMessage.text);
  }
}}

                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  voiceOutput
                    ? "bg-violet-600 text-white"
                    : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                }`}
                aria-pressed={voiceOutput}
              >
                {voiceOutput ? "🔊 Voice On" : "🔇 Voice Off"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current = null;
                  }
                }}
                className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
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
                    : "Ask Mira about your inventory..."
                }
                aria-label="Ask Mira a question"
                className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />

              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send ↑
              </button>
            </form>

            <p className="mt-3 text-center text-xs text-slate-500">
              English · Sinhala · Singlish
            </p>
          </div>
        </section>

        <aside className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-b from-white via-violet-50 to-purple-50 p-5 shadow-lg shadow-violet-100/60 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-purple-200/60 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex items-center justify-between">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                ● Online
              </span>

              <span className="text-xs font-semibold tracking-wide text-violet-700">
                MIRA AI
              </span>
            </div>

            <div className="mira-float relative mx-auto max-w-[280px] overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-xl shadow-violet-200/50">
              <img
                src={MIRA_IMAGE}
                alt="Mira, your SmartStock AI assistant"
                className="aspect-[3/4] w-full object-cover object-center"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-violet-950/90 via-violet-950/40 to-transparent p-5 pt-16">
                <p className="text-2xl font-bold text-white">
                  Hi, I’m Mira!
                </p>

                <p className="mt-1 text-sm text-violet-100">
                  Your smart inventory companion.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold text-violet-900">
                Mira
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                SmartStock AI Assistant
              </p>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-600">
                Ask about product quantities, prices, low-stock alerts,
                restocking and inventory reports.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Products</p>
                <p className="mt-2 text-2xl font-bold text-violet-700">
                  {products.length}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Total units</p>
                <p className="mt-2 text-2xl font-bold text-violet-700">
                  {formatNumber(totalStock)}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-800">Low stock</p>
                <p className="mt-2 text-2xl font-bold text-amber-900">
                  {lowStockProducts.length}
                </p>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs text-rose-800">Out of stock</p>
                <p className="mt-2 text-2xl font-bold text-rose-900">
                  {outOfStockProducts.length}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">
                Estimated inventory value
              </p>

              <p className="mt-2 text-xl font-bold text-violet-800">
                {formatMoney(inventoryValue)}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .mira-float {
          animation: miraFloat 4s ease-in-out infinite;
        }

        @keyframes miraFloat {
          0%, 100% {
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
