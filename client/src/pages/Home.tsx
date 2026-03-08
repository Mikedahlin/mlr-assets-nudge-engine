import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { ArrowRight, Banknote, BriefcaseBusiness, ChevronRight, Landmark, SendHorizontal, TrendingUp, Volume2, VolumeX } from "lucide-react";

const annualProjection = [
  {
    year: "2026",
    revenue: 420000,
    grossMargin: 68,
    ebitda: 92000,
    enterprise: 10,
    professional: 28,
    starter: 46,
  },
  {
    year: "2027",
    revenue: 890000,
    grossMargin: 74,
    ebitda: 278000,
    enterprise: 24,
    professional: 54,
    starter: 61,
  },
  {
    year: "2028",
    revenue: 1640000,
    grossMargin: 79,
    ebitda: 612000,
    enterprise: 41,
    professional: 83,
    starter: 72,
  },
];

const monthlyRunRate = [
  { month: "Jan", arr: 260000, cash: 188000, clients: 18 },
  { month: "Feb", arr: 282000, cash: 196000, clients: 20 },
  { month: "Mar", arr: 304000, cash: 205000, clients: 22 },
  { month: "Apr", arr: 332000, cash: 214000, clients: 24 },
  { month: "May", arr: 358000, cash: 225000, clients: 26 },
  { month: "Jun", arr: 384000, cash: 238000, clients: 28 },
  { month: "Jul", arr: 412000, cash: 248000, clients: 30 },
  { month: "Aug", arr: 438000, cash: 259000, clients: 32 },
  { month: "Sep", arr: 466000, cash: 271000, clients: 34 },
  { month: "Oct", arr: 492000, cash: 282000, clients: 35 },
  { month: "Nov", arr: 516000, cash: 293000, clients: 36 },
  { month: "Dec", arr: 548000, cash: 308000, clients: 38 },
];

const useOfFunds = [
  { label: "Product and ML", value: 42, color: "#1A6B3C" },
  { label: "Revenue operations", value: 24, color: "#C9A84C" },
  { label: "Customer success", value: 18, color: "#A95D41" },
  { label: "Compliance and reserves", value: 16, color: "#3E5F73" },
];

const assumptions = [
  "Net revenue retention rises from 109% in 2026 to 122% in 2028 as expansion motions mature.",
  "Gross margin expands with a larger self-serve base and lower onboarding effort per account.",
  "Sales efficiency improves after Q3 2026 once Stripe and Chargebee connectors reduce implementation work.",
];

const milestones = [
  {
    label: "Breakeven",
    value: "Q2 2027",
    detail: "Operating expenses flatten while ARR compounds through expansion revenue.",
    icon: Banknote,
  },
  {
    label: "Pipeline Coverage",
    value: "4.3x",
    detail: "Weighted pipeline covers the 2026 new-logo target with room for enterprise slippage.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Capital Ask",
    value: "$600k",
    detail: "Structured to extend runway through the first profitable quarter.",
    icon: Landmark,
  },
];

const starterMessages = [
  {
    id: 1,
    role: "bot",
    text: "Hey, I'm KIRA, your revenue intel sidekick. Ask about growth, churn, runway, or the three-year model.",
  },
];

const preferredFemaleVoices = [
  "Samantha",
  "Ava",
  "Victoria",
  "Allison",
  "Susan",
  "Karen",
  "Moira",
  "Zira",
  "Aria",
  "Jenny",
  "Serena",
  "Google UK English Female",
  "Microsoft Zira",
  "Microsoft Aria",
  "Microsoft Jenny",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
};

function buildReply(userText: string) {
  const lowerText = userText.toLowerCase();

  if (lowerText.includes("churn")) {
    return "Base-case churn moves from 7.4% in 2026 to 4.9% in 2028 as expansion and fit improve. The underwriting case assumes retention gets better, not perfect.";
  }

  if (lowerText.includes("runway") || lowerText.includes("cash")) {
    return "The current raise is sized for roughly 18 months of runway and a path into the first profitable quarter, with year-end cash reaching about $1.0M in the 2028 base case.";
  }

  if (lowerText.includes("revenue") || lowerText.includes("arr")) {
    return "The base case reaches about $1.64M of 2028 revenue. ARR builds steadily through 2026 while the customer mix shifts toward professional and enterprise accounts.";
  }

  if (lowerText.includes("margin") || lowerText.includes("ebitda")) {
    return "Gross margin expands from 68% to 79% across the model, and EBITDA rises to roughly $612k by 2028. The story is operating leverage, not aggressive top-line-only growth.";
  }

  if (lowerText.includes("capital") || lowerText.includes("fund")) {
    return "The capital plan asks for $600k. Most of it goes into product and ML, then revenue operations, with a smaller reserve for customer success and compliance.";
  }

  return "KIRA reads this as a base-case operator model: disciplined acquisition, improving retention, and margin lift that comes from better delivery efficiency rather than optimistic assumptions.";
}

function selectPreferredVoice(voices: SpeechSynthesisVoice[]) {
  const exactMatch = preferredFemaleVoices
    .map((candidate) => voices.find((voice) => voice.name.toLowerCase().includes(candidate.toLowerCase())))
    .find(Boolean);

  if (exactMatch) return exactMatch;

  const englishVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
  return englishVoice ?? voices[0] ?? null;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: "#8D6A1F" }}>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-t pt-4" style={{ borderColor: "#D8D2C7" }}>
      <div className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: "#7B746A" }}>
        {label}
      </div>
      <div
        className="mb-2 text-3xl font-semibold leading-none md:text-4xl"
        style={{ color: "#1C1C1E", fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {value}
      </div>
      <p className="max-w-xs text-sm leading-6" style={{ color: "#615B54" }}>
        {detail}
      </p>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(starterMessages as unknown as Message[]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(starterMessages.length + 1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const node = chatBodyRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceEnabled(false);
      return;
    }

    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      voiceRef.current = selectPreferredVoice(voices);
      setVoiceReady(Boolean(voiceRef.current));
    };

    assignVoice();
    window.speechSynthesis.addEventListener("voiceschanged", assignVoice);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", assignVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text: string) => {
    if (!voiceEnabled || !voiceReady || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceRef.current;
    utterance.rate = 0.96;
    utterance.pitch = 1.06;
    utterance.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = (draft?: string) => {
    const trimmed = (draft ?? input).trim();
    if (!trimmed || isThinking) return;

    const nextUserMessage: Message = {
      id: messageIdRef.current++,
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setIsThinking(true);

    window.setTimeout(() => {
      const reply = buildReply(trimmed);
      const nextBotMessage: Message = {
        id: messageIdRef.current++,
        role: "bot",
        text: reply,
      };

      setMessages((current) => [...current, nextBotMessage]);
      setIsThinking(false);
      speakText(reply);
    }, 1100);
  };

  return (
    <div className="min-h-screen" style={{ background: "#FAF8F5", color: "#1C1C1E" }}>
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ background: "rgba(250, 248, 245, 0.92)", backdropFilter: "blur(10px)", borderColor: "#E5DED2" }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-[3px] rounded-full" style={{ background: "#C9A84C" }} />
            <div>
              <div className="text-xs uppercase tracking-[0.24em]" style={{ color: "#7B746A" }}>
                ML&R Assets LLC
              </div>
              <div
                className="text-lg font-semibold"
                style={{ color: "#1C1C1E", fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                KIRA Revenue Intelligence
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-8 text-sm md:flex" style={{ color: "#5C564F" }}>
            <a href="#hero">Hero</a>
            <a href="#forecast">Forecast</a>
            <a href="#assumptions">Assumptions</a>
            <a href="#capital">Capital Plan</a>
          </div>
          <a
            href="/kira"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: "#1A6B3C", color: "#FAF8F5" }}
          >
            Open Model Explorer
            <ChevronRight size={16} />
          </a>
        </div>
      </nav>

      <section
        id="hero"
        className="relative overflow-hidden border-b"
        style={{
          borderColor: "#0C2B18",
          background: "radial-gradient(circle at top, rgba(212,175,55,0.22), transparent 35%), linear-gradient(180deg, #004225 0%, #001309 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-25" style={{ background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.06) 45%, transparent 100%)" }} />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-xl self-center text-white">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "#D4AF37" }}>
              KIRA Hero Interface
            </div>
            <h1
              className="text-5xl leading-[1.02] md:text-7xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Ask the model. Get the revenue story.
            </h1>
            <p className="mt-6 text-lg leading-8" style={{ color: "rgba(255, 250, 205, 0.88)" }}>
              KIRA now uses a female-presenting synthetic voice when the browser exposes one. I cannot make her sound
              like Scarlett Johansson specifically, but the selector prefers built-in voices like Samantha, Ava, Aria,
              Jenny, Zira, and other similar system voices.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => sendMessage("How does runway look?")}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
                style={{ background: "#D4AF37", color: "#004225" }}
              >
                Ask About Runway
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setVoiceEnabled((current) => !current)}
                className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-all"
                style={{ borderColor: "#D4AF37", color: "#FFFACD" }}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {voiceEnabled ? "Voice On" : "Voice Off"}
              </button>
            </div>
            <p className="mt-4 text-sm" style={{ color: "rgba(255, 250, 205, 0.72)" }}>
              {voiceReady
                ? "Voice is ready and will use the closest available built-in female-presenting system voice."
                : "Voice playback depends on browser speech synthesis and available local voices."}
            </p>
          </div>

          <div className="relative z-10">
            <div
              className="mx-auto flex h-[80vh] max-h-[760px] min-h-[560px] w-full max-w-[800px] flex-col overflow-hidden rounded-[24px]"
              style={{
                background: "rgba(0, 66, 37, 0.58)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(212,175,55,0.25)",
              }}
            >
              <div className="flex items-center justify-between border-b px-6 py-5" style={{ background: "#D4AF37", color: "#004225", borderColor: "#00311C" }}>
                <div className="text-2xl font-bold">KIRA Revenue Intelligence</div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em]">
                  {voiceEnabled ? "Female Voice" : "Text Only"}
                </div>
              </div>

              <div ref={chatBodyRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[75%] rounded-[20px] px-4 py-3 leading-6 shadow-sm ${message.role === "user" ? "ml-auto" : "mr-auto"}`}
                    style={{
                      background: message.role === "user" ? "#E0F8E0" : "#FFFACD",
                      color: "#1A1A1A",
                    }}
                  >
                    {message.text}
                  </div>
                ))}

                {isThinking ? (
                  <div className="mr-auto flex gap-2 px-3 py-2">
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full" style={{ background: "#D4AF37" }} />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:120ms]" style={{ background: "#D4AF37" }} />
                    <span className="h-2.5 w-2.5 animate-bounce rounded-full [animation-delay:240ms]" style={{ background: "#D4AF37" }} />
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-3 border-t px-4 py-4" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(212,175,55,0.45)" }}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask KIRA anything..."
                  className="flex-1 rounded-full border-none bg-white px-5 py-3 text-base text-[#1A1A1A] outline-none"
                />
                <button
                  onClick={() => sendMessage()}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold"
                  style={{ background: "#D4AF37", color: "#004225" }}
                >
                  <SendHorizontal size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="border-b" style={{ borderColor: "#E5DED2" }}>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div>
            <SectionEyebrow>Executive Report</SectionEyebrow>
            <h2
              className="max-w-4xl text-5xl leading-[1.02] md:text-7xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              A three-year growth case built for lenders, operators, and disciplined capital.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: "#615B54" }}>
              ML&R Assets projects a controlled climb from early ARR to durable EBITDA by pairing a narrow
              revenue-operations product with margin expansion, low implementation drag, and deliberate hiring.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#forecast"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
                style={{ background: "#C9A84C", color: "#1C1C1E" }}
              >
                Review Forecast
                <ArrowRight size={16} />
              </a>
              <a
                href="#capital"
                className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition-all"
                style={{ borderColor: "#C9A84C", color: "#1C1C1E" }}
              >
                See Capital Plan
              </a>
            </div>
          </div>

          <div className="grid gap-8 self-end">
            <MetricCard
              label="2028 Revenue"
              value={currencyFormatter.format(annualProjection[2].revenue)}
              detail="Base case assumes 196 active accounts and a heavier enterprise mix by year end."
            />
            <MetricCard
              label="2028 EBITDA"
              value={currencyFormatter.format(annualProjection[2].ebitda)}
              detail="The model reaches double-digit operating leverage without assuming aggressive headcount cuts."
            />
            <MetricCard
              label="Gross Margin Arc"
              value={`${annualProjection[0].grossMargin}% to ${annualProjection[2].grossMargin}%`}
              detail="Margin improves as deployment work standardizes and onboarding shifts toward templates."
            />
          </div>
        </div>
      </section>

      <section className="border-b" style={{ borderColor: "#E5DED2" }}>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {milestones.map(({ label, value, detail, icon: Icon }) => (
              <div key={label} className="rounded-[28px] border p-6" style={{ borderColor: "#E5DED2", background: "#FFFDFC" }}>
                <div className="mb-5 inline-flex rounded-full p-3" style={{ background: "#F3ECE0", color: "#1A6B3C" }}>
                  <Icon size={18} />
                </div>
                <div className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: "#7B746A" }}>
                  {label}
                </div>
                <div className="mb-3 text-3xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {value}
                </div>
                <p className="text-sm leading-6" style={{ color: "#615B54" }}>
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="forecast" className="border-b" style={{ borderColor: "#E5DED2" }}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <SectionEyebrow>Forecast</SectionEyebrow>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Revenue scales ahead of cost, and the cash curve stays visible.
            </h2>
            <p className="mt-4 text-lg leading-8" style={{ color: "#615B54" }}>
              The base case emphasizes operating clarity: visible ARR progression, an improving cash balance, and a
              customer mix that steadily shifts toward higher-value accounts.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "#E5DED2", background: "#FFFDFC" }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em]" style={{ color: "#7B746A" }}>
                    Monthly 2026 run rate
                  </div>
                  <div className="mt-2 text-2xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    ARR and cash on hand
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm" style={{ background: "#EDF3EE", color: "#1A6B3C" }}>
                  <TrendingUp size={16} />
                  Positive trajectory
                </div>
              </div>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRunRate}>
                    <defs>
                      <linearGradient id="arrFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A6B3C" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1A6B3C" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E7E0D5" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#7B746A" />
                    <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} stroke="#7B746A" />
                    <Tooltip
                      formatter={(value: number) => currencyFormatter.format(value)}
                      contentStyle={{ borderRadius: 18, border: "1px solid #E5DED2", background: "#FFFDFC" }}
                    />
                    <Area type="monotone" dataKey="arr" stroke="#1A6B3C" fill="url(#arrFill)" strokeWidth={2.4} />
                    <Area type="monotone" dataKey="cash" stroke="#C9A84C" fill="url(#cashFill)" strokeWidth={2.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "#E5DED2", background: "#FFFDFC" }}>
                <div className="mb-5 text-xs uppercase tracking-[0.22em]" style={{ color: "#7B746A" }}>
                  Annual projection
                </div>
                <div className="space-y-5">
                  {annualProjection.map((year) => (
                    <div key={year.year} className="border-t pt-5 first:border-t-0 first:pt-0" style={{ borderColor: "#E5DED2" }}>
                      <div className="mb-3 flex items-end justify-between">
                        <div className="text-2xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                          {year.year}
                        </div>
                        <div className="text-sm" style={{ color: "#615B54" }}>
                          Gross margin {year.grossMargin}%
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: "#615B54" }}>Revenue</span>
                        <strong>{currencyFormatter.format(year.revenue)}</strong>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span style={{ color: "#615B54" }}>EBITDA</span>
                        <strong>{currencyFormatter.format(year.ebitda)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "#E5DED2", background: "#1C1C1E", color: "#FAF8F5" }}>
                <div className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: "#CABFAE" }}>
                  Revenue composition
                </div>
                <div className="mb-5 text-2xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  Expansion shifts the mix up-market without dropping volume.
                </div>
                <p className="text-sm leading-6" style={{ color: "#D7D0C7" }}>
                  By 2028, enterprise and professional clients contribute most of the revenue lift while starter
                  accounts remain the top-of-funnel acquisition layer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b" style={{ borderColor: "#E5DED2" }}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionEyebrow>Customer Mix</SectionEyebrow>
              <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                The book gets healthier as enterprise density improves.
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-8" style={{ color: "#615B54" }}>
                The model does not depend on an unrealistic flood of large accounts. It depends on measured migration
                into better-fit plans and disciplined expansion revenue from proven customers.
              </p>
            </div>
            <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "#E5DED2", background: "#FFFDFC" }}>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualProjection}>
                    <CartesianGrid stroke="#E7E0D5" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="#7B746A" />
                    <YAxis tickLine={false} axisLine={false} stroke="#7B746A" />
                    <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid #E5DED2", background: "#FFFDFC" }} />
                    <Bar dataKey="starter" stackId="mix" radius={[0, 0, 12, 12]}>
                      {annualProjection.map((entry) => (
                        <Cell key={`${entry.year}-starter`} fill="#D8C3A0" />
                      ))}
                    </Bar>
                    <Bar dataKey="professional" stackId="mix">
                      {annualProjection.map((entry) => (
                        <Cell key={`${entry.year}-professional`} fill="#6B8F9D" />
                      ))}
                    </Bar>
                    <Bar dataKey="enterprise" stackId="mix" radius={[12, 12, 0, 0]}>
                      {annualProjection.map((entry) => (
                        <Cell key={`${entry.year}-enterprise`} fill="#1A6B3C" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm" style={{ color: "#615B54" }}>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#D8C3A0" }} />
                  Starter
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#6B8F9D" }} />
                  Professional
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#1A6B3C" }} />
                  Enterprise
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="assumptions" className="border-b" style={{ borderColor: "#E5DED2" }}>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <SectionEyebrow>Operating Assumptions</SectionEyebrow>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              The underwriting case is conservative where it should be.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8" style={{ color: "#615B54" }}>
              These assumptions support the model, but they also constrain it. The forecast avoids heroic pricing jumps,
              oversized hiring waves, or an abrupt enterprise-only pivot.
            </p>
          </div>
          <div className="space-y-6">
            {assumptions.map((assumption) => (
              <div key={assumption} className="flex gap-4 border-t pt-5" style={{ borderColor: "#E5DED2" }}>
                <div className="mt-1 h-10 w-[2px] rounded-full" style={{ background: "#C9A84C" }} />
                <p className="text-base leading-7" style={{ color: "#4F4943" }}>
                  {assumption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capital" className="border-b" style={{ borderColor: "#E5DED2" }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <SectionEyebrow>Capital Plan</SectionEyebrow>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              The raise is sized to finish the climb, not to subsidize drift.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8" style={{ color: "#615B54" }}>
              A $600,000 raise bridges product hardening, revenue operations, and the first profitable quarter. The
              capital plan preserves strategic flexibility while keeping burn visible.
            </p>
          </div>
          <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "#E5DED2", background: "#FFFDFC" }}>
            <div className="mb-6 text-xs uppercase tracking-[0.22em]" style={{ color: "#7B746A" }}>
              Use of funds
            </div>
            <div className="space-y-5">
              {useOfFunds.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span style={{ color: "#615B54" }}>{item.label}</span>
                    <strong>{item.value}%</strong>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#EEE7DC" }}>
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-[24px] p-5" style={{ background: "#F2EAD8" }}>
              <div className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: "#7B746A" }}>
                Runway effect
              </div>
              <div className="mb-2 text-2xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                18 months to profitability
              </div>
              <p className="text-sm leading-6" style={{ color: "#4F4943" }}>
                The raise preserves enough liquidity to keep customer delivery quality intact while still forcing
                discipline around hiring and sales conversion.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em]" style={{ color: "#7B746A" }}>
              ML&R Assets LLC
            </div>
            <div className="mt-2 text-2xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Financial projections, base case.
            </div>
          </div>
          <div className="text-sm leading-6" style={{ color: "#615B54" }}>
            View the interactive model explorer for scenario detail, monthly outputs, and segment assumptions.
            <div className="mt-2">
              <a href="/kira" className="inline-flex items-center gap-2 font-semibold" style={{ color: "#1A6B3C" }}>
                Open KIRA model explorer
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}








