import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  Bot,
  Download,
  LineChart as LineChartIcon,
  MessageCircleMore,
  PiggyBank,
  RotateCcw,
  SendHorizontal,
  SlidersHorizontal,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const scenarioMultipliers = {
  base: { revenue: 1, ebitda: 1, churn: 1 },
  upside: { revenue: 1.18, ebitda: 1.28, churn: 0.84 },
  downside: { revenue: 0.88, ebitda: 0.74, churn: 1.22 },
} as const;

type Scenario = keyof typeof scenarioMultipliers;
type ChartView = "financials" | "cashflow";
type MessageRole = "assistant" | "user";

type ProjectionYear = {
  year: string;
  revenue: number;
  ebitda: number;
  grossMargin: number;
  cashEnd: number;
  churn: number;
};

type ChatMetric = {
  label: string;
  value: string;
};

type ChatMessage = {
  id: number;
  role: MessageRole;
  text: string;
  metrics?: ChatMetric[];
};

const DEFAULT_PROJECTIONS: ProjectionYear[] = [
  { year: "2026", revenue: 420000, ebitda: 92000, grossMargin: 68, cashEnd: 308000, churn: 7.4 },
  { year: "2027", revenue: 890000, ebitda: 278000, grossMargin: 74, cashEnd: 512000, churn: 6.1 },
  { year: "2028", revenue: 1640000, ebitda: 612000, grossMargin: 79, cashEnd: 1024000, churn: 4.9 },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    text: "I am KIRA. Ask about revenue, churn, runway, or the projection stack and I will answer with the current mock underwriting view.",
    metrics: [
      { label: "2028 revenue", value: "$1.64M" },
      { label: "2028 churn", value: "4.9%" },
    ],
  },
];

const segmentMix = [
  { name: "Starter", value: 72, color: "#D4AF37" },
  { name: "Professional", value: 83, color: "#6FA87A" },
  { name: "Enterprise", value: 41, color: "#004225" },
];

const operatingLevers = [
  {
    title: "ARPA expansion",
    value: "+21%",
    detail: "Pricing mix tilts toward professional and enterprise plans as conversion quality improves.",
    icon: Target,
  },
  {
    title: "Cash discipline",
    value: "18 mo",
    detail: "The model preserves operating room while keeping a controlled hiring curve through 2027.",
    icon: PiggyBank,
  },
  {
    title: "Scenario range",
    value: "0.88x-1.18x",
    detail: "Management case spans moderate acquisition drag through stronger expansion execution.",
    icon: SlidersHorizontal,
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

function buildAssistantResponse(question: string, model: ProjectionYear[], scenario: Scenario): ChatMessage {
  const lowered = question.toLowerCase();
  const finalYear = model[model.length - 1];
  const cumulativeRevenue = model.reduce((sum, item) => sum + item.revenue, 0);
  const averageChurn = model.reduce((sum, item) => sum + item.churn, 0) / model.length;
  const bestCashYear = model.reduce((best, item) => (item.cashEnd > best.cashEnd ? item : best), model[0]);

  if (lowered.includes("churn") || lowered.includes("retention")) {
    return {
      id: Date.now(),
      role: "assistant",
      text: `In the ${scenario} case, churn steps down from ${percentFormatter.format(model[0].churn)}% in ${model[0].year} to ${percentFormatter.format(finalYear.churn)}% in ${finalYear.year}. The model assumes enterprise product adoption and tighter onboarding offset acquisition volatility.`,
      metrics: [
        { label: "Average churn", value: `${percentFormatter.format(averageChurn)}%` },
        { label: `${finalYear.year} churn`, value: `${percentFormatter.format(finalYear.churn)}%` },
      ],
    };
  }

  if (lowered.includes("projection") || lowered.includes("forecast") || lowered.includes("runway") || lowered.includes("cash")) {
    return {
      id: Date.now(),
      role: "assistant",
      text: `The projection stack ends ${finalYear.year} with ${formatCurrency(finalYear.cashEnd)} of cash and ${formatCurrency(finalYear.ebitda)} of EBITDA. The strongest cash year is ${bestCashYear.year}, which gives management room to absorb slower top-of-funnel conversion without breaking the plan.`,
      metrics: [
        { label: `${finalYear.year} cash`, value: formatCurrency(finalYear.cashEnd) },
        { label: `${finalYear.year} EBITDA`, value: formatCurrency(finalYear.ebitda) },
      ],
    };
  }

  return {
    id: Date.now(),
    role: "assistant",
    text: `The ${scenario} case underwrites ${formatCurrency(cumulativeRevenue)} of cumulative revenue through ${finalYear.year}, ending at ${formatCurrency(finalYear.revenue)} revenue with ${percentFormatter.format(finalYear.grossMargin)}% gross margin. Ask about churn, runway, or a specific year if you want a narrower readout.`,
    metrics: [
      { label: "Cumulative revenue", value: formatCurrency(cumulativeRevenue) },
      { label: `${finalYear.year} revenue`, value: formatCurrency(finalYear.revenue) },
    ],
  };
}

function selectPreferredVoice(voices: SpeechSynthesisVoice[]) {
  const preferredNames = ["samantha", "ava", "aria", "jenny", "zira", "serena", "victoria"];
  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));

  return (
    englishVoices.find((voice) => preferredNames.some((name) => voice.name.toLowerCase().includes(name))) ||
    englishVoices.find((voice) => ((((voice as SpeechSynthesisVoice & { gender?: string }).gender) || "").toLowerCase().includes("female"))) ||
    englishVoices[0] ||
    null
  );
}

function ScenarioCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border p-5" style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(255, 250, 205, 0.62)" }}>
      <div className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: "#004225" }}>
        {label}
      </div>
      <div className="mb-2 text-3xl font-semibold" style={{ color: "#032917", fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {value}
      </div>
      <p className="text-sm leading-6" style={{ color: "#28533A" }}>
        {detail}
      </p>
    </div>
  );
}

export default function Kira() {
  const [scenario, setScenario] = useLocalStorage<Scenario>("mlr-kira-scenario", "base");
  const [chartView, setChartView] = useLocalStorage<ChartView>("mlr-kira-chart-view", "financials");
  const [projections, setProjections] = useLocalStorage<ProjectionYear[]>("mlr-kira-projections", DEFAULT_PROJECTIONS);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>("mlr-kira-chat-messages", DEFAULT_MESSAGES);
  const [voiceEnabled, setVoiceEnabled] = useLocalStorage<boolean>("mlr-kira-voice-enabled", true);
  const [chatExpanded, setChatExpanded] = useLocalStorage<boolean>("mlr-kira-chat-expanded", true);
  const [prompt, setPrompt] = useState("");
  const [voiceReady, setVoiceReady] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const model = useMemo(() => {
    const multiplier = scenarioMultipliers[scenario];

    return projections.map((entry) => ({
      ...entry,
      revenue: entry.revenue * multiplier.revenue,
      ebitda: entry.ebitda * multiplier.ebitda,
      churn: entry.churn * multiplier.churn,
      cashEnd: entry.cashEnd * (0.92 + multiplier.ebitda * 0.12),
    }));
  }, [projections, scenario]);

  const finalYear = model[model.length - 1];
  const totalRevenue = model.reduce((sum, year) => sum + year.revenue, 0);
  const arrBridge = model.map((year) => ({
    year: year.year,
    revenue: Math.round(year.revenue),
    ebitda: Math.round(year.ebitda),
    cashEnd: Math.round(year.cashEnd),
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const applyVoices = () => {
      const selectedVoice = selectPreferredVoice(window.speechSynthesis?.getVoices() || []);
      voiceRef.current = selectedVoice;
      setVoiceReady(Boolean(selectedVoice));
    };

    applyVoices();
    window.speechSynthesis.onvoiceschanged = applyVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceRef.current;
    utterance.rate = 0.86;
    utterance.pitch = 0.9;
    utterance.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const submitPrompt = () => {
    const question = prompt.trim();
    if (!question) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: question,
    };

    const assistantMessage = buildAssistantResponse(question, model, scenario);

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setPrompt("");
    speakText(assistantMessage.text);
  };

  const updateProjection = (year: string, field: keyof ProjectionYear, rawValue: string) => {
    const value = Number(rawValue);
    if (Number.isNaN(value)) return;

    setProjections((current) =>
      current.map((projection) => (projection.year === year ? { ...projection, [field]: value } : projection)),
    );
  };

  const resetLocalState = () => {
    setScenario("base");
    setChartView("financials");
    setProjections(DEFAULT_PROJECTIONS);
    setMessages(DEFAULT_MESSAGES);
    setVoiceEnabled(true);
    setChatExpanded(true);
    setPrompt("");

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #032917 0%, #00160C 58%, #000000 100%)", color: "#F7F4ED" }}>
      <div className="border-b" style={{ borderColor: "rgba(212, 175, 55, 0.24)", background: "rgba(0, 66, 37, 0.78)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#D4AF37" }}>
                <ArrowLeft size={16} />
                Back to report
              </a>
              <div className="text-xs uppercase tracking-[0.24em]" style={{ color: "#F6E8B1" }}>
                KIRA voice command center
              </div>
              <h1 className="mt-2 text-4xl md:text-5xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Investor-grade projections with a live KIRA voice desk.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8" style={{ color: "#D8EAD8" }}>
                Scenario controls, charts, and chat memory persist locally. Voice output uses your browser's available
                system voice and prefers a slower female-presenting delivery when one is exposed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(["base", "upside", "downside"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setScenario(option)}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: scenario === option ? "#D4AF37" : "rgba(255, 250, 205, 0.14)",
                    color: scenario === option ? "#032917" : "#F7F4ED",
                  }}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setVoiceEnabled((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "rgba(212, 175, 55, 0.4)", color: "#F7F4ED" }}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {voiceEnabled ? "Voice on" : "Voice off"}
              </button>
              <button
                onClick={resetLocalState}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: "rgba(212, 175, 55, 0.4)", color: "#F7F4ED" }}
              >
                <RotateCcw size={16} />
                Reset Local State
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: "rgba(212, 175, 55, 0.4)", color: "#F7F4ED" }}>
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <ScenarioCard label="Cumulative revenue" value={formatCurrency(totalRevenue)} detail="Three-year revenue contribution under the active case." />
          <ScenarioCard label="2028 EBITDA" value={formatCurrency(finalYear.ebitda)} detail="Terminal-year operating profit after delivery and team assumptions." />
          <ScenarioCard label="2028 churn" value={`${percentFormatter.format(finalYear.churn)}%`} detail="Annualized gross churn under the selected scenario." />
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(255, 250, 205, 0.08)" }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em]" style={{ color: "#F6E8B1" }}>
                    Persisted controls
                  </div>
                  <div className="mt-2 text-2xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    Projection inputs and chart mode
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(["financials", "cashflow"] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setChartView(view)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
                      style={{
                        background: chartView === view ? "#D4AF37" : "rgba(255, 250, 205, 0.14)",
                        color: chartView === view ? "#032917" : "#F7F4ED",
                      }}
                    >
                      {view === "financials" ? "Financials" : "Cash View"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {projections.map((projection) => (
                  <div key={projection.year} className="rounded-[24px] border p-4" style={{ borderColor: "rgba(212, 175, 55, 0.18)", background: "rgba(255, 250, 205, 0.82)", color: "#032917" }}>
                    <div className="mb-3 text-lg font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {projection.year}
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm">
                        Revenue
                        <input type="number" value={projection.revenue} onChange={(event) => updateProjection(projection.year, "revenue", event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" style={{ borderColor: "rgba(0, 66, 37, 0.18)", background: "#FFFDF4" }} />
                      </label>
                      <label className="block text-sm">
                        EBITDA
                        <input type="number" value={projection.ebitda} onChange={(event) => updateProjection(projection.year, "ebitda", event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" style={{ borderColor: "rgba(0, 66, 37, 0.18)", background: "#FFFDF4" }} />
                      </label>
                      <label className="block text-sm">
                        Cash End
                        <input type="number" value={projection.cashEnd} onChange={(event) => updateProjection(projection.year, "cashEnd", event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" style={{ borderColor: "rgba(0, 66, 37, 0.18)", background: "#FFFDF4" }} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(255, 250, 205, 0.08)" }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em]" style={{ color: "#F6E8B1" }}>
                    Live model view
                  </div>
                  <div className="mt-2 text-2xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {chartView === "financials" ? "Revenue and EBITDA by scenario" : "Cash position by scenario"}
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm" style={{ background: "rgba(212, 175, 55, 0.15)", color: "#F6E8B1" }}>
                  <LineChartIcon size={16} />
                  {scenario} case
                </div>
              </div>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === "financials" ? (
                    <ComposedChart data={arrBridge}>
                      <CartesianGrid stroke="rgba(255, 250, 205, 0.18)" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="#F6E8B1" />
                      <YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} stroke="#F6E8B1" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 18, border: "1px solid rgba(212, 175, 55, 0.22)", background: "#FFF8E1", color: "#032917" }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#D4AF37" radius={[12, 12, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="ebitda" stroke="#9AD4A3" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  ) : (
                    <BarChart data={arrBridge}>
                      <CartesianGrid stroke="rgba(255, 250, 205, 0.18)" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="#F6E8B1" />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} stroke="#F6E8B1" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 18, border: "1px solid rgba(212, 175, 55, 0.22)", background: "#FFF8E1", color: "#032917" }} />
                      <Legend />
                      <Bar dataKey="cashEnd" fill="#9AD4A3" radius={[12, 12, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border p-0" style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(0, 66, 37, 0.68)", overflow: "hidden" }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "rgba(212, 175, 55, 0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #D4AF37 0%, #FFFACD 100%)", color: "#004225" }}>
                  <Bot size={22} />
                </div>
                <div>
                  <div className="text-sm font-semibold">KIRA Revenue Intelligence</div>
                  <div className="text-xs" style={{ color: "#D8EAD8" }}>
                    {voiceReady ? "Voice ready" : "Voice depends on browser support"}
                  </div>
                </div>
              </div>
              <button onClick={() => setChatExpanded((current) => !current)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(212, 175, 55, 0.12)", color: "#F6E8B1" }}>
                <MessageCircleMore size={16} />
                {chatExpanded ? "Collapse" : "Expand"}
              </button>
            </div>

            {chatExpanded ? (
              <>
                <div className="max-h-[560px] space-y-4 overflow-y-auto px-5 py-5">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[88%] rounded-[24px] px-4 py-3 shadow-sm" style={{ background: message.role === "user" ? "#E0F8E0" : "#FFFACD", color: "#1A1A1A" }}>
                        <div className="text-sm leading-6">{message.text}</div>
                        {message.metrics?.length ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {message.metrics.map((metric) => (
                              <div key={metric.label} className="rounded-2xl border px-3 py-2" style={{ borderColor: "rgba(0, 66, 37, 0.12)", background: "rgba(255,255,255,0.55)" }}>
                                <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "#49654F" }}>
                                  {metric.label}
                                </div>
                                <div className="mt-1 text-base font-semibold" style={{ color: "#004225" }}>
                                  {metric.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t px-5 py-4" style={{ borderColor: "rgba(212, 175, 55, 0.2)" }}>
                  <div className="mb-3 text-xs uppercase tracking-[0.2em]" style={{ color: "#F6E8B1" }}>
                    Ask about revenue, churn, runway, or projections
                  </div>
                  <div className="flex gap-3">
                    <input
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          submitPrompt();
                        }
                      }}
                      placeholder="How does churn move in the upside case?"
                      className="w-full rounded-full border px-4 py-3 text-sm outline-none"
                      style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(255,250,205,0.95)", color: "#032917" }}
                    />
                    <button onClick={submitPrompt} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" style={{ background: "#D4AF37", color: "#004225" }}>
                      <SendHorizontal size={16} />
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-4">
            {operatingLevers.map(({ title, value, detail, icon: Icon }) => (
              <div key={title} className="rounded-[24px] border p-5" style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(255, 250, 205, 0.08)" }}>
                <div className="mb-4 inline-flex rounded-full p-3" style={{ background: "rgba(212, 175, 55, 0.15)", color: "#D4AF37" }}>
                  <Icon size={18} />
                </div>
                <div className="mb-2 text-xs uppercase tracking-[0.22em]" style={{ color: "#F6E8B1" }}>
                  {title}
                </div>
                <div className="mb-2 text-3xl font-semibold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {value}
                </div>
                <p className="text-sm leading-6" style={{ color: "#D8EAD8" }}>
                  {detail}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-8 md:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(255, 250, 205, 0.08)" }}>
              <div className="mb-4 text-xs uppercase tracking-[0.22em]" style={{ color: "#F6E8B1" }}>
                Customer mix
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={segmentMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={3}>
                      {segmentMix.map((segment) => (
                        <Cell key={segment.name} fill={segment.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} accounts`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[32px] border p-6 md:p-8" style={{ borderColor: "rgba(212, 175, 55, 0.22)", background: "rgba(255, 250, 205, 0.08)" }}>
              <div className="mb-6 text-xs uppercase tracking-[0.22em]" style={{ color: "#F6E8B1" }}>
                KIRA answer chart
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={model}>
                    <CartesianGrid stroke="rgba(255, 250, 205, 0.18)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} stroke="#F6E8B1" />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value)}%`} stroke="#F6E8B1" />
                    <Tooltip formatter={(value: number) => `${percentFormatter.format(value)}%`} contentStyle={{ borderRadius: 18, border: "1px solid rgba(212, 175, 55, 0.22)", background: "#FFF8E1", color: "#032917" }} />
                    <Bar dataKey="churn" fill="#D4AF37" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




