"use client"

import {
  Timer,
  Coffee,
  Clock,
  Play,
  Shield,
  ShieldOff,
  Music,
  BarChart3,
  Heart,
  CheckSquare,
  Zap,
  RotateCcw,
  CheckCircle,
  TrendingUp,
  Flame,
  ListTodo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"

const features = [
  {
    id: "smart-timer",
    label: "Smart Timer",
    title: "Pomodoro & Flow Modes",
    description:
      "Switch between traditional 25-minute Pomodoro sprints with 4-cycle tracking or continuous Flow mode that auto-calculates breaks as 1/5th of your session.",
    highlights: [
      { icon: Timer, label: "Pomodoro with 4-cycle tracking" },
      { icon: Clock, label: "Flow mode with auto break calc" },
      { icon: Coffee, label: "Short & long break support" },
    ],
  },
  {
    id: "focus-shield",
    label: "Focus Shield",
    title: "Distraction Site Blocker",
    description:
      "Browser extension shield that blocks distracting websites during active sessions. Custom domain blocklists with soft warnings or hard block modes.",
    highlights: [
      { icon: ShieldOff, label: "Custom domain blocklists" },
      { icon: Shield, label: "Soft warning or hard block" },
      { icon: Zap, label: "Active only during sessions" },
    ],
  },
  {
    id: "lofi-player",
    label: "Lofi Player",
    title: "Built-in Focus Music",
    description:
      "Curated lofi beats player that syncs across all your devices. Create an uninterrupted focus environment with adjustable volume and ambient sounds.",
    highlights: [
      { icon: Music, label: "Curated lofi beats library" },
      { icon: Play, label: "Cross-device sync" },
      { icon: VolumeSmallIcon, label: "Adjustable volume control" },
    ],
  },
  {
    id: "session-tasks",
    label: "Tasks",
    title: "Session-Linked Tasks",
    description:
      "Group tasks into categories, set estimates, and track subtasks. Finishing a timer session auto-marks your active task as completed.",
    highlights: [
      { icon: ListTodo, label: "Custom task categories" },
      { icon: CheckSquare, label: "Subtask tracking" },
      { icon: CheckCircle, label: "Auto-complete on session end" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    title: "Stats & Streak Tracking",
    description:
      "Visualize daily focus minutes, task completion rates, current streak metrics, and peak focus hours with comprehensive analytics dashboards.",
    highlights: [
      { icon: BarChart3, label: "Daily focus minute tracking" },
      { icon: Flame, label: "Streak & consistency metrics" },
      { icon: TrendingUp, label: "Peak focus hour insights" },
    ],
  },
  {
    id: "mood",
    label: "Mood",
    title: "Mood & Reflections",
    description:
      "Log energy level and mood after every focus session to discover your peak productivity windows and build self-awareness.",
    highlights: [
      { icon: Heart, label: "Post-session mood logging" },
      { icon: SmileSmallIcon, label: "Energy level tracking" },
      { icon: TrendingUp, label: "Productivity pattern insights" },
    ],
  },
] as const

type FeatureId = (typeof features)[number]["id"]

function VolumeSmallIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function SmileSmallIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  )
}

function FeatureList({ items }: { items: { icon: React.ComponentType<{ className?: string }>; label: string }[] }) {
  return (
    <ul className="text-muted-foreground mt-8 divide-y *:flex *:items-center *:gap-3 *:py-3">
      {items.map(({ icon: Icon, label }) => (
        <li key={label}>
          <Icon className="size-4" />
          {label}
        </li>
      ))}
    </ul>
  )
}

function TimerIllustration() {
  return (
    <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-6 flex flex-col items-center gap-4">
      <div className="flex gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-[260px]">
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-white text-black">
          <Timer className="size-3" />
          Pomodoro
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-zinc-500">
          <Coffee className="size-3" />
          Break
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-zinc-500">
          <Clock className="size-3" />
          Flow
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < 1
                ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                : i === 1
                  ? "bg-zinc-300 ring-2 ring-white/30 animate-pulse"
                  : "bg-zinc-700"
            }`}
          />
        ))}
        <span className="text-[10px] font-mono text-zinc-400 ml-1">Pomodoro 2 of 4</span>
      </div>

      <div className="text-5xl font-bold tracking-tighter tabular-nums text-white select-none py-2">
        25:00
      </div>

      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
        <ListTodo className="size-3.5 text-zinc-500" />
        <span className="text-xs font-medium text-white">welcome</span>
      </div>

      <div className="w-full max-w-[200px] h-1 bg-zinc-800 rounded-full">
        <div className="h-full bg-white rounded-full w-1/3" />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <RotateCcw className="size-4" />
        </button>
        <button className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shadow-lg">
          <Play className="size-5 fill-current" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <CheckCircle className="size-4" />
        </button>
      </div>
    </div>
  )
}

function ShieldIllustration() {
  return (
    <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <ShieldOff className="size-4 text-red-400 shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-bold text-red-400">Blocked</div>
          <div className="text-[10px] text-red-400/70">twitter.com</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <ShieldOff className="size-4 text-red-400 shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-bold text-red-400">Blocked</div>
          <div className="text-[10px] text-red-400/70">reddit.com</div>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <Shield className="size-4 text-emerald-400 shrink-0" />
        <div className="flex-1">
          <div className="text-xs font-bold text-emerald-400">Shield Active</div>
          <div className="text-[10px] text-emerald-400/70">3 sites blocked this session</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-1">
        <div className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-[10px] font-bold text-zinc-500">Sites Blocked</div>
          <div className="text-xl font-bold text-white mt-0.5">12</div>
        </div>
        <div className="py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <div className="text-[10px] font-bold text-zinc-500">Focus Saved</div>
          <div className="text-xl font-bold text-white mt-0.5">45m</div>
        </div>
      </div>
    </div>
  )
}

function LofiIllustration() {
  return (
    <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <Music className="size-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Lofi Beats</div>
              <div className="text-[11px] text-zinc-500">Chill Vibes</div>
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-5">
            <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: "40%", animationDelay: "0ms" }} />
            <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: "80%", animationDelay: "150ms" }} />
            <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: "60%", animationDelay: "300ms" }} />
            <div className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: "100%", animationDelay: "450ms" }} />
          </div>
        </div>
        <div className="relative h-1.5 bg-zinc-800 rounded-full mb-5">
          <div className="absolute h-full bg-white rounded-full w-2/5" />
          <div className="absolute h-3 w-3 bg-white rounded-full top-1/2 -translate-y-1/2 left-[40%] shadow" />
        </div>
        <div className="flex items-center justify-center gap-5">
          <RotateCcw className="size-4 text-zinc-500" />
          <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
            <Play className="size-5 fill-current ml-0.5" />
          </button>
          <VolumeSmallIcon className="size-4 text-zinc-500" />
        </div>
      </div>
    </div>
  )
}

function TasksIllustration() {
  const tasks = [
    { text: "Design landing page", done: true },
    { text: "Write documentation", done: true },
    { text: "Implement timer feature", done: false },
    { text: "Add lofi player", done: false },
  ]
  return (
    <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-6 flex flex-col gap-2.5">
      {tasks.map((task, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800/60"
        >
          {task.done ? (
            <CheckCircle className="size-4 text-white shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded border border-zinc-700 shrink-0" />
          )}
          <span className={`text-xs font-medium ${task.done ? "text-zinc-500 line-through" : "text-white"}`}>
            {task.text}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center px-3">
          <span className="text-[11px] text-zinc-600">Add a task...</span>
        </div>
      </div>
    </div>
  )
}

function AnalyticsIllustration() {
  const bars = [30, 55, 45, 70, 60, 85, 75, 90, 65, 80, 95, 70]
  return (
    <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-500 mb-1">Today</div>
          <div className="text-2xl font-bold text-white">3h 24m</div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="size-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-bold">+12%</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-500 mb-1">Streak</div>
          <div className="text-2xl font-bold text-white flex items-center gap-1.5">
            <Flame className="size-5 text-orange-400" />
            7
          </div>
          <div className="text-[10px] text-zinc-600 mt-2">days</div>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="text-[11px] font-bold text-zinc-500 mb-3">This Week</div>
        <div className="flex items-end gap-1.5 h-20">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${i >= 10 ? "bg-white" : "bg-zinc-700"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MoodIllustration() {
  const moods = [
    { icon: Flame, label: "Fired Up", count: 12, color: "text-orange-400" },
    { icon: TrendingUp, label: "Good", count: 8, color: "text-emerald-400" },
    { icon: Clock, label: "Neutral", count: 4, color: "text-zinc-400" },
    { icon: Coffee, label: "Tired", count: 2, color: "text-blue-400" },
  ]
  return (
    <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-6 flex flex-col gap-3">
      <div className="text-xs font-bold text-white">How are you feeling?</div>
      <div className="grid grid-cols-2 gap-2.5">
        {moods.map((mood) => (
          <div
            key={mood.label}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800"
          >
            <mood.icon className={`size-5 ${mood.color} shrink-0`} />
            <div>
              <div className="text-[11px] font-bold text-white">{mood.label}</div>
              <div className="text-[10px] text-zinc-500">{mood.count} sessions</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="text-[10px] font-bold text-zinc-500 mb-1">Session Notes</div>
        <div className="text-xs text-zinc-300 leading-relaxed">Felt productive today. Deep work session went well.</div>
      </div>
    </div>
  )
}

const illustrations: Record<FeatureId, React.ComponentType> = {
  "smart-timer": TimerIllustration,
  "focus-shield": ShieldIllustration,
  "lofi-player": LofiIllustration,
  "session-tasks": TasksIllustration,
  analytics: AnalyticsIllustration,
  mood: MoodIllustration,
}

export function FeaturesSection() {
  const [activeId, setActiveId] = useState<FeatureId>("smart-timer")
  const sectionRefs = useRef<Partial<Record<FeatureId, HTMLDivElement>>>({})

  const scrollToFeature = (id: FeatureId) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" })
    setActiveId(id)
  }

  useEffect(() => {
    const sections = features
      .map((f) => sectionRefs.current[f.id])
      .filter((s): s is HTMLDivElement => s != null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const nextId = visible[0]?.target.id as FeatureId | undefined
        if (nextId) setActiveId(nextId)
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.15, 0.35, 0.55, 0.75] }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-muted-foreground max-w-4xl text-balance text-4xl font-medium tracking-tight">
          <span className="text-foreground">Built for deep focus.</span> <br /> One unified productivity suite.
        </h2>
        <div className="mt-16 grid gap-6 md:mt-32 lg:grid-cols-[auto_1fr]">
          <div className="sticky top-24 h-fit w-56 max-lg:hidden">
            <div className="text-muted-foreground text-sm">Features</div>
            <div className="-ml-4 mt-4 flex flex-col *:justify-start">
              {features.map((feature) => (
                <Button
                  key={feature.id}
                  type="button"
                  variant="ghost"
                  data-state={activeId === feature.id ? "active" : undefined}
                  onClick={() => scrollToFeature(feature.id)}
                  className="not-data-[state=active]:text-muted-foreground hover:bg-transparent"
                >
                  {feature.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-16 md:gap-32">
            {features.map((feature) => {
              const Illustration = illustrations[feature.id]
              return (
                <div
                  key={feature.id}
                  ref={(el) => { sectionRefs.current[feature.id] = el ?? undefined }}
                  id={feature.id}
                  className="grid scroll-mt-32 gap-8 sm:grid-cols-2 md:grid-cols-5 lg:gap-12"
                >
                  <div className="flex flex-col justify-between pb-4 md:col-span-2">
                    <div className="md:pr-6 lg:pr-0">
                      <h3 className="text-muted-foreground mb-6 text-sm font-medium">{feature.title}</h3>
                      <p className="text-muted-foreground text-balance text-lg font-medium">
                        <span className="text-foreground">{feature.description.split(".")[0]}.</span>{" "}
                        {feature.description.split(".").slice(1).join(".")}
                      </p>
                    </div>
                    <FeatureList items={[...feature.highlights]} />
                  </div>
                  <div className="md:col-span-3 flex items-center justify-center">
                    <Illustration />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
