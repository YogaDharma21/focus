"use client"

import {
  Timer,
  Coffee,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  ListTodo,
  CheckSquare,
  BarChart2,
  Smile,
  Settings,
  Shield,
  Music,
  ChevronUp,
  Focus,
  Target,
} from "lucide-react"



function ControlButtons({
  size = "normal",
}: {
  size?: "normal" | "small"
}) {
  const btnSize = size === "small" ? "w-10 h-10" : "w-12 h-12"
  const playSize = size === "small" ? "w-14 h-14" : "w-16 h-16"
  const iconSize = size === "small" ? "size-4" : "size-5"

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        className={`${btnSize} rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400`}
      >
        <RotateCcw className={iconSize} />
      </button>
      <button
        className={`${btnSize} rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400`}
      >
        <Target className={iconSize} />
      </button>
      <button
        className={`${playSize} rounded-2xl bg-[#e6e6e6] hover:bg-white text-zinc-950 shadow-xl flex items-center justify-center`}
      >
        <Play className={`${size === "small" ? "size-5" : "size-6"} fill-current`} />
      </button>
      <button
        className={`${btnSize} rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400`}
      >
        <CheckCircle className={iconSize} />
      </button>
      <button
        className={`${btnSize} rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400`}
      >
        <Focus className={iconSize} />
      </button>
    </div>
  )
}

function LofiBar({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between bg-neutral-900/90 border-neutral-800 rounded-2xl ${
        compact ? "p-2 px-3" : "p-2.5 px-4"
      }`}
    >
      <div className="flex items-center gap-2">
        <Music className={`${compact ? "size-3.5" : "size-4"} text-muted-foreground`} />
        <span
          className={`font-semibold text-foreground ${
            compact ? "text-[11px]" : "text-xs"
          }`}
        >
          Lo-Fi
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`${compact ? "w-6 h-6" : "w-7 h-7"} rounded-lg bg-white text-black flex items-center justify-center`}
        >
          <Play className={`${compact ? "size-2.5" : "size-3"} fill-current`} />
        </button>
        <ChevronUp className={`${compact ? "size-3" : "size-3.5"} text-muted-foreground`} />
      </div>
    </div>
  )
}

export function WebTimerPreview() {
  return (
    <div className="w-full bg-[#09090b] rounded-xl overflow-hidden border border-zinc-800/50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Timer className="size-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">Focus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#141416]/90 border border-white/10 text-white/90">
            <Music className="size-3.5" />
            <span className="text-[11px] font-medium">Lo-Fi</span>
            <div className="flex items-end gap-[2px] h-3">
              <div className="w-[2px] bg-primary rounded-full animate-bounce" style={{ height: "60%", animationDelay: "0ms" }} />
              <div className="w-[2px] bg-primary rounded-full animate-bounce" style={{ height: "100%", animationDelay: "150ms" }} />
              <div className="w-[2px] bg-primary rounded-full animate-bounce" style={{ height: "40%", animationDelay: "300ms" }} />
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <Focus className="size-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
            <Settings className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-5 py-6">
        {/* Mode Switcher */}
        <div className="flex gap-2 p-1 bg-secondary/40 rounded-[10px] border border-border/30 mb-4">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-medium bg-primary text-primary-foreground shadow-md">
            <Timer className="size-3.5" />
            <span>Flow</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-medium text-muted-foreground">
            <Coffee className="size-3.5" />
            <span>Break</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-medium text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Focus</span>
          </div>
        </div>

        {/* Flow Status */}
        <div className="mb-5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/40 border border-border/50">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(255,255,255,0.7)] animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground font-mono">
              Flow Active
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="text-[5rem] md:text-[7rem] font-bold leading-none tracking-tighter tabular-nums text-foreground select-none font-sans">
          25:00
        </div>

        {/* Task Selector */}
        <div className="mt-5 mb-4">
          <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-[10px] px-4 py-2.5 text-white">
            <ListTodo className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">welcome</span>
          </div>
        </div>

        {/* Subtasks */}
        <div className="w-full max-w-xs bg-card border border-border/40 rounded-[10px] p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <ListTodo className="size-3" />
              <span>welcome</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Clear</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <div className="w-3.5 h-3.5 rounded border border-zinc-700 flex items-center justify-center">
                <CheckCircle className="size-2.5 text-muted-foreground" />
              </div>
              <span>hello</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <div className="w-3.5 h-3.5 rounded border border-zinc-700" />
              <span>hi</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs h-1.5 bg-zinc-800/80 rounded-full mb-5">
          <div className="bg-zinc-200 h-full rounded-full w-1/3" />
        </div>

        {/* Controls */}
        <ControlButtons />
      </div>

      {/* Bottom Nav */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-zinc-800/50">
        {[
          { icon: Timer, label: "Timer", active: true },
          { icon: CheckSquare, label: "Tasks" },
          { icon: Shield, label: "Shield" },
          { icon: Smile, label: "Mood" },
          { icon: BarChart2, label: "Stats" },
        ].map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
              active
                ? "bg-white text-black"
                : "text-neutral-500"
            }`}
          >
            <Icon className="size-3" />
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DesktopTimerPreview() {
  return (
    <div className="w-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/50">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
            <Timer className="size-2 text-primary-foreground" />
          </div>
          <span className="text-[10px] font-medium text-zinc-300">Focus Desktop</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-14 border-r border-zinc-800 p-1.5 flex flex-col gap-1">
          {[
            { icon: Timer, active: true },
            { icon: CheckSquare },
            { icon: BarChart2 },
            { icon: Smile },
            { icon: Settings },
          ].map(({ icon: Icon, active }, i) => (
            <div
              key={i}
              className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                active
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                  : "text-zinc-500"
              }`}
            >
              <Icon className="size-3.5" />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center px-4 py-5">
          {/* Mode Switcher */}
          <div className="bg-[#141414] border border-zinc-800/80 p-1 rounded-lg flex items-center w-56 mb-3">
            <div className="flex-1 py-1.5 text-[10px] font-semibold rounded-xl bg-[#e6e6e6] text-zinc-950 text-center shadow-sm">
              Flow
            </div>
            <div className="flex-1 py-1.5 text-[10px] font-semibold rounded-xl text-zinc-400 text-center">
              Break
            </div>
            <div className="flex-1 py-1.5 text-[10px] font-semibold rounded-xl text-zinc-400 text-center">
              Focus
            </div>
          </div>

          {/* Flow Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-300 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)] animate-pulse" />
            <span className="ml-1">Flow Active</span>
          </div>

          {/* Timer */}
          <div className="text-[4.5rem] md:text-[5.5rem] font-extrabold tracking-tighter text-white leading-none font-sans tabular-nums select-none">
            25:00
          </div>

          {/* Task Selector */}
          <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-lg px-3 py-2 mt-4 mb-3">
            <ListTodo className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-white">welcome</span>
          </div>

          {/* Progress */}
          <div className="w-full max-w-[200px] h-1.5 bg-zinc-800/80 rounded-full mb-4">
            <div className="bg-zinc-200 h-full rounded-full w-1/4" />
          </div>

          {/* Controls */}
          <ControlButtons size="small" />
        </div>

        {/* Right spacer for sidebar feel */}
        <div className="w-10 border-l border-zinc-800/30" />
      </div>
    </div>
  )
}

export function MobileTimerPreview() {
  return (
    <div className="w-full max-w-[280px] mx-auto bg-[#09090b] rounded-[28px] overflow-hidden border-2 border-zinc-800">
      {/* Status Bar area */}
      <div className="h-5 flex items-center justify-center">
        <div className="w-16 h-3 bg-zinc-800 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Timer className="size-2.5 text-primary-foreground" />
          </div>
          <span className="text-xs font-bold text-foreground">FOCUS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="p-1 rounded-md text-zinc-400">
            <Target className="size-3" />
          </button>
          <button className="p-1 rounded-md text-zinc-400">
            <Settings className="size-3" />
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5">
        {[
          { icon: Timer, label: "Timer", active: true },
          { icon: CheckSquare, label: "Tasks" },
          { icon: Shield, label: "Shield" },
          { icon: Smile, label: "Mood" },
          { icon: BarChart2, label: "Stats" },
        ].map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-bold ${
              active ? "bg-white text-black" : "text-neutral-500"
            }`}
          >
            <Icon className="size-2" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Lofi Bar */}
      <div className="px-3 pt-1.5">
        <LofiBar compact />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-4 py-4">
        {/* Mode Switcher */}
        <div className="flex w-full max-w-[220px] p-0.5 bg-[#141414] border border-zinc-800 rounded-[10px] mb-3">
          <div className="flex-1 py-1.5 text-[9px] font-bold rounded-[10px] bg-white text-black text-center shadow-sm">
            Flow
          </div>
          <div className="flex-1 py-1.5 text-[9px] font-bold rounded-[10px] text-zinc-500 text-center">
            Break
          </div>
          <div className="flex-1 py-1.5 text-[9px] font-bold rounded-[10px] text-zinc-500 text-center">
            Focus
          </div>
        </div>

        {/* Timer */}
        <div className="text-[3.5rem] font-extrabold tracking-tighter text-white leading-none tabular-nums select-none my-2">
          25:00
        </div>

        {/* Status */}
        <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-300 mb-3">
          PAUSED
        </div>

        {/* Task Selector */}
        <div className="w-full flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-[10px] px-3 py-2 mb-3">
          <span className="text-[11px] font-bold text-white flex-1 text-center">welcome</span>
        </div>

        {/* Subtasks */}
        <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-[10px] p-2.5 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold text-white">welcome</span>
            <span className="text-[8px] text-zinc-500">Clear</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] text-white">
              <CheckCircle className="size-2 text-zinc-400" />
              <span>hello</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-white">
              <div className="w-2 h-2 rounded border border-zinc-600" />
              <span>hi</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button className="w-8 h-8 rounded-[10px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Target className="size-3" />
          </button>
          <button className="w-8 h-8 rounded-[10px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <RotateCcw className="size-3" />
          </button>
          <button className="w-11 h-11 rounded-[10px] bg-white text-black shadow-lg flex items-center justify-center">
            <Play className="size-4 fill-current" />
          </button>
          <button className="w-8 h-8 rounded-[10px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Focus className="size-3" />
          </button>
          <button className="w-8 h-8 rounded-[10px] bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Settings className="size-3" />
          </button>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="flex items-center justify-around px-3 py-2 border-t border-zinc-800/50 mt-1">
        {[
          { icon: Timer, active: true },
          { icon: CheckSquare },
          { icon: Shield },
          { icon: Smile },
          { icon: BarChart2 },
        ].map(({ icon: Icon, active }, i) => (
          <div
            key={i}
            className={`p-1.5 rounded-lg ${active ? "text-white" : "text-zinc-600"}`}
          >
            <Icon className="size-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExtensionTimerPreview() {
  return (
    <div className="w-full max-w-[320px] mx-auto bg-[#09090b] rounded-xl overflow-hidden border border-zinc-800/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950/95 border-b border-neutral-800/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <Timer className="size-2.5 text-primary-foreground" />
          </div>
          <span className="text-[11px] font-extrabold tracking-wider uppercase text-white">FOCUS</span>
        </div>
        <button className="p-1 text-neutral-400">
          <Settings className="size-3.5" />
        </button>
      </div>

      {/* Lofi Bar */}
      <div className="px-3 pt-2">
        <LofiBar compact />
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-neutral-900/60">
        {[
          { icon: Timer, label: "Timer", active: true },
          { icon: CheckSquare, label: "Tasks", badge: "3" },
          { icon: Shield, label: "Shield" },
          { icon: Smile, label: "Mood" },
          { icon: BarChart2, label: "Stats" },
        ].map(({ icon: Icon, label, active, badge }) => (
          <div
            key={label}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-bold min-h-[26px] ${
              active
                ? "bg-white text-black shadow-sm"
                : "text-neutral-500"
            }`}
          >
            <Icon className="size-2.5" />
            <span>{label}</span>
            {badge && !active && (
              <span className="w-3 h-3 rounded-full bg-neutral-700 text-white text-[6px] font-mono flex items-center justify-center">
                {badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-4 py-4">
        {/* Mode Switcher */}
        <div className="flex w-full max-w-[240px] p-0.5 rounded-lg border bg-neutral-900 border-neutral-800 mb-3">
          <div className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-white text-black text-center shadow-md">
            Flow
          </div>
          <div className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-neutral-400 text-center">
            Break
          </div>
          <div className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-neutral-400 text-center">
            Focus
          </div>
        </div>

        {/* Flow Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[8px] font-mono text-neutral-300 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.7)] animate-pulse" />
          <span className="ml-0.5">Flow Active</span>
        </div>

        {/* Timer */}
        <div className="text-5xl font-black font-mono tracking-tighter leading-none text-white tabular-nums select-none my-2">
          25:00
        </div>

        {/* Status */}
        <div className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[9px] font-bold text-neutral-300 mb-3">
          PAUSED
        </div>

        {/* Task Selector */}
        <div className="w-full max-w-[220px] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-lg px-3 py-2 mb-3">
          <ListTodo className="size-3 text-muted-foreground" />
          <span className="text-[11px] font-medium text-white text-center flex-1">welcome</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <RotateCcw className="size-3" />
          </button>
          <button className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <Target className="size-3" />
          </button>
          <button className="w-10 h-10 rounded-2xl bg-white text-black shadow-lg flex items-center justify-center">
            <Play className="size-4 fill-current" />
          </button>
          <button className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <CheckCircle className="size-3" />
          </button>
          <button className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <Focus className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
