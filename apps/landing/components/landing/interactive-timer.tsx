"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Calculator, Zap } from "lucide-react"

export function InteractiveTimer() {
  const [mode, setMode] = useState<"pomodoro" | "flow">("pomodoro")
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [seconds, setSeconds] = useState<number>(25 * 60)
  const [flowSeconds, setFlowSeconds] = useState<number>(1200)
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(true)
  const [selectedTask, setSelectedTask] = useState<string>("Landing Page Design")

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

  const tasks = [
    "Landing Page Design",
    "Focus Shield Integration",
    "Cross-Platform Monorepo Sync",
    "Lofi Player",
  ]

  return (
    <section id="interactive-demo" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <span>Live Interactive Demo</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Try the Focus Timer
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Test both Pomodoro and Flow modes with intelligent break calculation and built-in Lofi music.
          </p>
        </div>

        {/* Demo Card - Minimal */}
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8">
          {/* Mode Switcher */}
          <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-muted rounded-xl max-w-xs mx-auto">
            <button
              onClick={() => handleModeChange("pomodoro")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                mode === "pomodoro"
                  ? "bg-background text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => handleModeChange("flow")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                mode === "flow"
                  ? "bg-background text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="size-3.5" />
              Flow Mode
            </button>
          </div>

          {/* User-friendly Task Selection */}
          <div className="mb-6 flex flex-col items-center">
            <span className="text-xs font-medium text-muted-foreground mb-2">
              What are you working on?
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {tasks.map((task) => (
                <button
                  key={task}
                  onClick={() => setSelectedTask(task)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTask === task
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {selectedTask === task && <CheckCircle className="inline size-3 mr-1" />}
                  {task}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Circle */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="size-56 sm:size-64 rounded-full border-2 border-border bg-background flex flex-col items-center justify-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                {mode === "pomodoro" ? "Focus Session" : "Flow Mode Active"}
              </span>

              <span className="text-5xl font-black font-mono tracking-tight text-foreground">
                {mode === "pomodoro" ? formatTime(seconds) : formatTime(flowSeconds)}
              </span>

              {mode === "flow" && (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md">
                  <Calculator className="size-3" />
                  <span>Calculated Break: {calculatedBreakMins} min</span>
                </div>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity"
              >
                {isRunning ? (
                  <>
                    <Pause className="size-4 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-4 fill-current" /> Start Session
                  </>
                )}
              </button>
              <button
                onClick={resetTimer}
                className="p-2.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          {/* Music Section */}
          <div className="mt-8 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMusicPlaying ? (
                  <Volume2 className="size-4 text-foreground" />
                ) : (
                  <VolumeX className="size-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-foreground">Music:</span>
              </div>

              <button
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  isMusicPlaying
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>🎧</span>
                <span>Lofi Beats</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
