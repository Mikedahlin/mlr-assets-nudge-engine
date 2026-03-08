import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Flame,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Frequency = "Daily" | "3x/week" | "4x/week" | "Weekends";

type Hobby = {
  id: number;
  name: string;
  category: string;
  streak: number;
  goal: Frequency;
  doneToday: boolean;
  sessionsThisWeek: number;
  note: string;
  weeklyLog: boolean[];
};

type EditDraft = {
  name: string;
  category: string;
  goal: Frequency;
  note: string;
};

const STORAGE_KEY = "mlr-hobbies-dashboard";
const FILTER_KEY = "mlr-hobbies-dashboard-filter";
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const starterHobbies: Hobby[] = [
  {
    id: 1,
    name: "Guitar",
    category: "Music",
    streak: 14,
    goal: "Daily",
    doneToday: false,
    sessionsThisWeek: 5,
    note: "Focus on fingerstyle transitions for 20 minutes.",
    weeklyLog: [true, true, false, true, true, false, true],
  },
  {
    id: 2,
    name: "Reading",
    category: "Mind",
    streak: 5,
    goal: "3x/week",
    doneToday: true,
    sessionsThisWeek: 3,
    note: "Finish one chapter before bed.",
    weeklyLog: [true, false, true, false, false, true, false],
  },
  {
    id: 3,
    name: "Gym",
    category: "Fitness",
    streak: 21,
    goal: "4x/week",
    doneToday: false,
    sessionsThisWeek: 4,
    note: "Push day and a 10-minute cooldown walk.",
    weeklyLog: [true, false, true, true, false, true, false],
  },
  {
    id: 4,
    name: "Sketching",
    category: "Creative",
    streak: 9,
    goal: "Weekends",
    doneToday: false,
    sessionsThisWeek: 1,
    note: "Do one quick urban sketch from memory.",
    weeklyLog: [false, false, false, false, false, true, false],
  },
];

const goalTargets: Record<Frequency, number> = {
  Daily: 7,
  "3x/week": 3,
  "4x/week": 4,
  Weekends: 2,
};

const categoryAccent: Record<string, string> = {
  Music: "#F59E0B",
  Mind: "#38BDF8",
  Fitness: "#FB7185",
  Creative: "#A78BFA",
  New: "#34D399",
};

function normalizeHobbies(hobbies: Hobby[]) {
  return hobbies.map((hobby) => ({
    ...hobby,
    weeklyLog: Array.isArray(hobby.weeklyLog) && hobby.weeklyLog.length === 7 ? hobby.weeklyLog : [false, false, false, false, false, false, false],
  }));
}

function getCategoryColor(category: string) {
  return categoryAccent[category] ?? "#34D399";
}

function buildEditDraft(hobby: Hobby): EditDraft {
  return {
    name: hobby.name,
    category: hobby.category,
    goal: hobby.goal,
    note: hobby.note,
  };
}

export default function Hobbies() {
  const [hobbies, setHobbies] = useLocalStorage<Hobby[]>(STORAGE_KEY, starterHobbies);
  const [activeCategory, setActiveCategory] = useLocalStorage<string>(FILTER_KEY, "All");
  const [newHobby, setNewHobby] = useState("");
  const [newCategory, setNewCategory] = useState("New");
  const [newGoal, setNewGoal] = useState<Frequency>("Daily");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  const safeHobbies = useMemo(() => normalizeHobbies(hobbies), [hobbies]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(safeHobbies.map((hobby) => hobby.category))).sort();
    return ["All", ...values];
  }, [safeHobbies]);

  const filteredHobbies = useMemo(() => {
    if (activeCategory === "All") return safeHobbies;
    return safeHobbies.filter((hobby) => hobby.category === activeCategory);
  }, [activeCategory, safeHobbies]);

  const stats = useMemo(() => {
    const longestStreak = safeHobbies.reduce((max, hobby) => Math.max(max, hobby.streak), 0);
    const mostConsistent =
      [...safeHobbies].sort((left, right) => right.sessionsThisWeek - left.sessionsThisWeek || right.streak - left.streak)[0]
        ?.name ?? "None";
    const weeklyTarget = safeHobbies.reduce((sum, hobby) => sum + goalTargets[hobby.goal], 0);
    const weeklySessions = safeHobbies.reduce((sum, hobby) => sum + hobby.sessionsThisWeek, 0);
    const weeklyRate = weeklyTarget === 0 ? 0 : Math.round((weeklySessions / weeklyTarget) * 100);
    const checkedInToday = safeHobbies.filter((hobby) => hobby.doneToday).length;

    return {
      longestStreak,
      mostConsistent,
      weeklyRate,
      checkedInToday,
      weeklySessions,
    };
  }, [safeHobbies]);

  const toggleDone = (id: number) => {
    setHobbies((current) =>
      normalizeHobbies(current).map((hobby) => {
        if (hobby.id !== id) return hobby;

        const doneToday = !hobby.doneToday;
        const nextWeeklyLog = [...hobby.weeklyLog];
        nextWeeklyLog[nextWeeklyLog.length - 1] = doneToday;

        return {
          ...hobby,
          doneToday,
          streak: doneToday ? hobby.streak + 1 : Math.max(0, hobby.streak - 1),
          sessionsThisWeek: nextWeeklyLog.filter(Boolean).length,
          weeklyLog: nextWeeklyLog,
        };
      }),
    );
  };

  const addHobby = () => {
    const trimmed = newHobby.trim();
    if (!trimmed) return;

    setHobbies((current) => [
      {
        id: Date.now(),
        name: trimmed,
        category: newCategory.trim() || "New",
        streak: 0,
        goal: newGoal,
        doneToday: false,
        sessionsThisWeek: 0,
        note: "New habit queued. Add a ritual and first check-in.",
        weeklyLog: [false, false, false, false, false, false, false],
      },
      ...normalizeHobbies(current),
    ]);
    setNewHobby("");
    setNewCategory("New");
    setNewGoal("Daily");
  };

  const startEditing = (hobby: Hobby) => {
    setEditingId(hobby.id);
    setEditDraft(buildEditDraft(hobby));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEditing = (id: number) => {
    if (!editDraft) return;

    setHobbies((current) =>
      normalizeHobbies(current).map((hobby) =>
        hobby.id === id
          ? {
              ...hobby,
              name: editDraft.name.trim() || hobby.name,
              category: editDraft.category.trim() || "New",
              goal: editDraft.goal,
              note: editDraft.note.trim() || hobby.note,
            }
          : hobby,
      ),
    );
    cancelEditing();
  };

  const deleteHobby = (id: number) => {
    setHobbies((current) => normalizeHobbies(current).filter((hobby) => hobby.id !== id));
    if (editingId === id) cancelEditing();
  };

  const resetLocalState = () => {
    setHobbies(starterHobbies);
    setActiveCategory("All");
    setNewHobby("");
    setNewCategory("New");
    setNewGoal("Daily");
    cancelEditing();
  };

  return (
    <div
      className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top, rgba(245,158,11,0.14), transparent 22%), linear-gradient(180deg, #052e16 0%, #020617 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-emerald-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              <Sparkles size={14} />
              Hobbies Hub
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-amber-300 md:text-6xl">
              A hobby dashboard that rewards consistency, not guilt.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-100/80 md:text-lg">
              Track streaks, check in daily, filter by category, edit in place, and keep everything persisted locally.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={resetLocalState}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              <RotateCcw size={18} />
              Reset Local State
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/30 bg-white/5 px-5 py-3 font-semibold text-white transition hover:border-amber-300/60"
            >
              Back Home
              <ArrowRight size={18} />
            </a>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Active Hobbies" value={String(safeHobbies.length)} accent="#FBBF24" />
          <StatCard label="Longest Streak" value={`${stats.longestStreak} days`} accent="#F97316" />
          <StatCard label="Weekly Completion" value={`${stats.weeklyRate}%`} accent="#22C55E" />
          <StatCard label="Most Consistent" value={stats.mostConsistent} accent="#38BDF8" />
          <StatCard label="Checked In Today" value={`${stats.checkedInToday}/${safeHobbies.length}`} accent="#A78BFA" />
        </section>

        <section className="mb-8 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className="rounded-full border px-4 py-2 text-sm font-semibold transition"
              style={{
                borderColor: activeCategory === category ? "#FBBF24" : "rgba(255,255,255,0.12)",
                background: activeCategory === category ? "rgba(251,191,36,0.14)" : "rgba(255,255,255,0.04)",
                color: activeCategory === category ? "#FCD34D" : "#D1FAE5",
              }}
            >
              {category}
            </button>
          ))}
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-emerald-950/40 p-5 shadow-2xl shadow-black/20 backdrop-blur md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/60">Daily board</p>
                <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Quick check-ins, edits, and live streaks</h2>
              </div>
              <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm font-medium text-amber-300">
                {filteredHobbies.length} visible
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredHobbies.map((hobby) => {
                const isEditing = editingId === hobby.id && editDraft;

                return (
                  <article
                    key={hobby.id}
                    className="rounded-[24px] border border-white/8 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-amber-300/40"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              value={editDraft.name}
                              onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/60"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={editDraft.category}
                                onChange={(event) => setEditDraft({ ...editDraft, category: event.target.value })}
                                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/60"
                              />
                              <select
                                value={editDraft.goal}
                                onChange={(event) => setEditDraft({ ...editDraft, goal: event.target.value as Frequency })}
                                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-amber-300/60"
                              >
                                <option>Daily</option>
                                <option>3x/week</option>
                                <option>4x/week</option>
                                <option>Weekends</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="truncate text-xl font-semibold text-white">{hobby.name}</h3>
                            <span
                              className="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{
                                background: `${getCategoryColor(hobby.category)}22`,
                                color: getCategoryColor(hobby.category),
                              }}
                            >
                              {hobby.category}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-300">
                        <Flame size={16} />
                        {hobby.streak}
                      </div>
                    </div>

                    {isEditing ? (
                      <textarea
                        value={editDraft.note}
                        onChange={(event) => setEditDraft({ ...editDraft, note: event.target.value })}
                        className="mb-5 min-h-[5rem] w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-amber-300/60"
                      />
                    ) : (
                      <p className="mb-5 min-h-[3rem] text-sm leading-6 text-emerald-100/70">{hobby.note}</p>
                    )}

                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-emerald-100/50">
                        <span>Weekly target</span>
                        <span>
                          {hobby.sessionsThisWeek}/{goalTargets[hobby.goal]}
                        </span>
                      </div>
                      <div className="mb-3 h-2 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (hobby.sessionsThisWeek / goalTargets[hobby.goal]) * 100)}%`,
                            background: getCategoryColor(hobby.category),
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {hobby.weeklyLog.map((done, index) => (
                          <div key={`${hobby.id}-${WEEK_DAYS[index]}`} className="space-y-1 text-center">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/35">{WEEK_DAYS[index]}</div>
                            <div
                              className="h-7 rounded-lg border"
                              style={{
                                borderColor: done ? `${getCategoryColor(hobby.category)}88` : "rgba(255,255,255,0.08)",
                                background: done ? `${getCategoryColor(hobby.category)}66` : "rgba(255,255,255,0.05)",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-emerald-100/70">Goal: {isEditing ? editDraft.goal : hobby.goal}</p>
                        <p className="text-xs text-emerald-100/45">{hobby.doneToday ? "Checked in today" : "Still open for today"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditing(hobby.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-green-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-400"
                            >
                              <Check size={16} />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(hobby)}
                              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteHobby(hobby.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/25"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                            <button
                              onClick={() => toggleDone(hobby.id)}
                              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                hobby.doneToday
                                  ? "bg-green-500 text-white hover:bg-green-400"
                                  : "bg-slate-700 text-white hover:bg-slate-600"
                              }`}
                            >
                              {hobby.doneToday ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                              {hobby.doneToday ? "Done" : "Check In"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-amber-400/15 bg-amber-400/10 p-5 backdrop-blur md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Quick add</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Add a new ritual in under 10 seconds.</h2>
              <div className="mt-5 space-y-3">
                <input
                  type="text"
                  value={newHobby}
                  onChange={(event) => setNewHobby(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addHobby();
                  }}
                  placeholder="New hobby..."
                  className="w-full rounded-2xl border border-white/10 bg-emerald-950/70 px-4 py-3 text-white outline-none placeholder:text-emerald-100/35 focus:border-amber-300/60"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value || "New")}
                    placeholder="Category"
                    className="w-full rounded-2xl border border-white/10 bg-emerald-950/70 px-4 py-3 text-white outline-none placeholder:text-emerald-100/35 focus:border-amber-300/60"
                  />
                  <select
                    value={newGoal}
                    onChange={(event) => setNewGoal(event.target.value as Frequency)}
                    className="w-full rounded-2xl border border-white/10 bg-emerald-950/70 px-4 py-3 text-white outline-none focus:border-amber-300/60"
                  >
                    <option>Daily</option>
                    <option>3x/week</option>
                    <option>4x/week</option>
                    <option>Weekends</option>
                  </select>
                </div>
                <button
                  onClick={addHobby}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-emerald-950 transition hover:bg-amber-300"
                >
                  <Plus size={18} />
                  Add to Dashboard
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100/50">Focus cue</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">One next action beats ten intentions.</h3>
              <div className="mt-5 space-y-4">
                {filteredHobbies
                  .slice()
                  .sort((left, right) => Number(left.doneToday) - Number(right.doneToday) || right.streak - left.streak)
                  .slice(0, 3)
                  .map((hobby) => (
                    <div key={hobby.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{hobby.name}</div>
                          <div className="text-sm text-emerald-100/60">{hobby.note}</div>
                        </div>
                        <div className="inline-flex items-center gap-1 text-sm font-semibold text-amber-300">
                          <Target size={16} />
                          {hobby.goal}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
      <p className="text-sm uppercase tracking-[0.22em] text-emerald-100/55">{label}</p>
      <p className="mt-3 text-3xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
