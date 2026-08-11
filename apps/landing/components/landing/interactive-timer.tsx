"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle, Calculator, Zap } from "lucide-react"

export function InteractiveTimer() {
  const [mode, setMode] = useState<"pomodoro" | "flow">("pomodoro")
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [seconds, setSeconds] = useState<number>(25 * 60) // 25 mins for pomodoro, 0 for flow
  const [flowSeconds, setFlowSeconds] = useState<number>(1200) // 20 mins simulated flow time
  const [activeSound, setActiveSound] = useState<string | null>("rain")
  const [selectedTask, setSelectedTask] = useState<string>("Landing Page Architecture")

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === "pomodoro") {
          setSeconds((prev) => (prev > 0 ? prev - 1 : 0))
        } else {
          setFlowSeconds((prev) => prev + 1)
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, mode])

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate 1/5th Flow break duration
  const calculatedBreakMins = Math.max(1, Math.round(flowSeconds / 5 / 60))

  const handleModeChange = (newMode: "pomodoro" | "flow") => {
    setMode(newMode)
    setIsRunning(false)
    if (newMode === "pomodoro") {
      setSeconds(25 * 60)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    if (mode === "pomodoro") {
      setSeconds(25 * 60)
    } else {
      setFlowSeconds(0)
    }
  }

  const sounds = [
    { id: "rain", name: "Rainfall", icon: "🌧️" },
    { id: "cafe", name: "Cozy Cafe", icon: "☕" },
    { id: "lofi", name: "Lofi Beats", icon: "🎧" },
    { id: "waves", name: "Ocean Waves", icon: "🌊" },
  ]

  const tasks = [
    "Landing Page Architecture",
    "Focus Shield Website Blocker Integration",
    "Cross-Platform Monorepo Synchronization",
    "Ambient Soundscape Player",
  ]

  return (
    <section id="interactive-demo" className="py-24 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="size-3.5" />
            <span>Interactive Live Playground</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Try the Focus Timer Right Now
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Experience both structured Pomodoro and adaptive Flow modes with intelligent break calculation and ambient soundscapes.
          </p>
        </div>

        {/* Interactive Demo Card */}
        <div className="max-w-3xl mx-auto bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 mb-8 p-1.5 bg-muted/60 rounded-2xl max-w-sm mx-auto">
            <button
              onClick={() => handleModeChange("pomodoro")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                mode === "pomodoro"
                  ? "bg-background text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => handleModeChange("flow")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === "flow"
                  ? "bg-background text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="size-3.5 text-amber-500" />
              Flow Mode (Stopwatch)
            </button>
          </div>

          {/* Active Task Linkage Dropdown/Pill */}
          <div className="mb-8 flex flex-col items-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Linked Task Session
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {tasks.map((task) => (
                <button
                  key={task}
                  onClick={() => setSelectedTask(task)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTask === task
                      ? "bg-indigo-500/10 border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted border border-transparent"
                  }`}
                >
                  {selectedTask === task && <CheckCircle className="inline size-3 mr-1" />}
                  {task}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Display Display Dial */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative size-64 sm:size-72 rounded-full border-4 border-indigo-500/20 bg-background/50 flex flex-col items-center justify-center shadow-inner group">
              {/* Animated Progress Ring */}
              <div
                className={`absolute inset-0 rounded-full border-4 border-indigo-500 transition-all ${
                  isRunning ? "animate-pulse" : ""
                }`}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
              />

              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-indigo-500 mb-1">
                {mode === "pomodoro" ? "Focus Session" : "Flow Mode Active"}
              </span>

              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-foreground">
                {mode === "pomodoro" ? formatTime(seconds) : formatTime(flowSeconds)}
              </span>

              {/* Flow Mode Smart Break Indicator */}
              {mode === "flow" && (
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Calculator className="size-3.5" />
                  <span>Calculated Break: {calculatedBreakMins} min</span>
                </div>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 scale-105 active:scale-95"
              >
                {isRunning ? (
                  <>
                    <Pause className="size-5 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-5 fill-current" /> Start Session
                  </>
                )}
              </button>
              <button
                onClick={resetTimer}
                className="p-3.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
                title="Reset Timer"
              >
                <RotateCcw className="size-5" />
              </button>
            </div>
          </div>

          {/* Ambient Sound Player Simulation Bar */}
          <div className="mt-10 pt-6 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {activeSound ? (
                  <Volume2 className="size-4 text-indigo-500 animate-pulse" />
                ) : (
                  <VolumeX className="size-4 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-foreground">Ambient Soundscape:</span>
                {activeSound && (
                  <span className="text-xs font-mono text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    Playing...
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {sounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setActiveSound(activeSound === sound.id ? null : sound.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                      activeSound === sound.id
                        ? "bg-indigo-500 text-white shadow-md"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{sound.icon}</span>
                    <span>{sound.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
