"use client"

import {
  Timer,
  Coffee,
  Clock,
  Play,
  Pause,
  Shield,
  ShieldOff,
  Music,
  BarChart3,
  CheckSquare,
  ChevronDown,
  Zap,
  RotateCcw,
  Target,
  Focus,
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
    badge: "Smart Break Calc",
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
    badge: "Browser Extension",
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
    badge: "Music",
    highlights: [
      { icon: Music, label: "Curated lofi beats library" },
      { icon: Play, label: "Cross-device sync" },
      { icon: VolumeIcon, label: "Adjustable volume control" },
    ],
  },
  {
    id: "session-tasks",
    label: "Tasks",
    title: "Session-Linked Tasks",
    description:
      "Group tasks into categories, set estimates, and track subtasks. Finishing a timer session auto-marks your active task as completed.",
    badge: "Task Sync",
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
    badge: "Analytics",
    highlights: [
      { icon: BarChart3, label: "Daily focus minute tracking" },
      { icon: Flame, label: "Streak & consistency metrics" },
      { icon: TrendingUp, label: "Peak focus hour insights" },
    ],
  },
] as const

type FeatureId = (typeof features)[number]["id"]

function VolumeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
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
    <div className="bg-card border-border/50 relative flex aspect-square rounded-3xl border p-6 md:col-span-3">
      <div className="m-auto w-full max-w-[280px]">
        <div className="flex gap-2 p-1 bg-secondary/40 rounded-[10px] border border-border/30 mb-4">
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium bg-primary text-primary-foreground shadow-md">
            <Timer className="size-3" />
            Pomodoro
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium text-muted-foreground">
            <Coffee className="size-3" />
            Break
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-xs font-medium text-muted-foreground">
            <Clock className="size-3" />
            Flow
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/50">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < 1
                    ? "bg-primary shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                    : i === 1
                      ? "bg-primary/70 ring-2 ring-primary/30 animate-pulse"
                      : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-5xl font-bold text-center tracking-tighter tabular-nums text-foreground select-none">
          25:00
        </div>
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-[10px] px-4 py-2">
            <ListTodo className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">welcome</span>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <Button size="sm" className="rounded-xl">
            <Play className="size-3.5 fill-current" />
            Start Session
          </Button>
        </div>
      </div>
    </div>
  )
}

function ShieldIllustration() {
  return (
    <div className="bg-card border-border/50 relative flex aspect-square rounded-3xl border p-6 md:col-span-3">
      <div className="m-auto w-full max-w-[280px] space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <ShieldOff className="size-5 text-red-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-red-400">Blocked</div>
            <div className="text-[10px] text-red-400/70">twitter.com</div>
          </div>
          <div className="ml-auto">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <ShieldOff className="size-5 text-red-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-red-400">Blocked</div>
            <div className="text-[10px] text-red-400/70">reddit.com</div>
          </div>
          <div className="ml-auto">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Shield className="size-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-emerald-400">Shield Active</div>
            <div className="text-[10px] text-emerald-400/70">3 sites blocked this session</div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <div className="flex-1 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
            <div className="text-[10px] font-bold text-muted-foreground">Sites Blocked</div>
            <div className="text-lg font-bold text-foreground">12</div>
          </div>
          <div className="flex-1 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-center">
            <div className="text-[10px] font-bold text-muted-foreground">Focus Saved</div>
            <div className="text-lg font-bold text-foreground">45m</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LofiIllustration() {
  return (
    <div className="bg-card border-border/50 relative flex aspect-square rounded-3xl border p-6 md:col-span-3">
      <div className="m-auto w-full max-w-[280px]">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="size-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Lofi Beats</div>
                <div className="text-[10px] text-muted-foreground">Chill Vibes</div>
              </div>
            </div>
            <div className="flex items-end gap-[2px] h-4">
              <div className="w-[3px] bg-primary rounded-full animate-bounce" style={{ height: "40%", animationDelay: "0ms" }} />
              <div className="w-[3px] bg-primary rounded-full animate-bounce" style={{ height: "80%", animationDelay: "150ms" }} />
              <div className="w-[3px] bg-primary rounded-full animate-bounce" style={{ height: "60%", animationDelay: "300ms" }} />
              <div className="w-[3px] bg-primary rounded-full animate-bounce" style={{ height: "100%", animationDelay: "450ms" }} />
            </div>
          </div>
          <div className="relative h-1 bg-neutral-800 rounded-full mb-3">
            <div className="absolute h-full bg-primary rounded-full w-2/5" />
          </div>
          <div className="flex items-center justify-center gap-4">
            <RotateCcw className="size-4 text-muted-foreground" />
            <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
              <Play className="size-4 fill-current" />
            </button>
            <VolumeIcon className="size-4 text-muted-foreground" />
          </div>
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
    <div className="bg-card border-border/50 relative flex aspect-square rounded-3xl border p-6 md:col-span-3">
      <div className="m-auto w-full max-w-[280px] space-y-2">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60"
          >
            {task.done ? (
              <CheckCircle className="size-4 text-primary shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded border border-zinc-700 shrink-0" />
            )}
            <span className={`text-xs font-medium ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {task.text}
            </span>
          </div>
        ))}
        <div className="pt-2 flex items-center gap-2">
          <div className="flex-1 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center px-3">
            <span className="text-[10px] text-muted-foreground">Add a task...</span>
          </div>
          <Button size="icon-xs" variant="secondary">
            <Target className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function AnalyticsIllustration() {
  const bars = [30, 55, 45, 70, 60, 85, 75, 90, 65, 80, 95, 70]
  return (
    <div className="bg-card border-border/50 relative flex aspect-square rounded-3xl border p-6 md:col-span-3">
      <div className="m-auto w-full max-w-[280px]">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-[10px] text-muted-foreground mb-0.5">Today</div>
            <div className="text-lg font-bold text-foreground">3h 24m</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="size-2.5 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-medium">+12%</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-[10px] text-muted-foreground mb-0.5">Streak</div>
            <div className="text-lg font-bold text-foreground flex items-center gap-1">
              <Flame className="size-4 text-orange-400" />
              7
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">days</div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[10px] text-muted-foreground mb-2">This Week</div>
          <div className="flex items-end gap-1 h-16">
            {bars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${i >= 10 ? "bg-primary" : "bg-zinc-700"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
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
          {/* Sticky Sidebar */}
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

          {/* Scrollable Feature Sections */}
          <div className="flex flex-col gap-16 md:gap-32">
            {features.map((feature) => {
              const Illustration = illustrations[feature.id]
              return (
                <div
                  key={feature.id}
                  ref={(el) => { sectionRefs.current[feature.id] = el ?? undefined }}
                  id={feature.id}
                  className="grid scroll-mt-32 gap-6 sm:grid-cols-2 md:grid-cols-5 lg:gap-12"
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
                  <Illustration />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
