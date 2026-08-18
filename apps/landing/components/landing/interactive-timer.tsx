"use client"

import { useState, useEffect, useRef } from "react"
import { Timer, Coffee, Clock, Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Calculator, Headphones } from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap"

export function InteractiveTimer() {
  const [mode, setMode] = useState<"pomodoro" | "break" | "flow">("pomodoro")
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [seconds, setSeconds] = useState<number>(25 * 60)
  const [flowSeconds, setFlowSeconds] = useState<number>(1200)
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(0.5) // Default volume at 50%
  const [selectedTask, setSelectedTask] = useState<string>("Landing Page Design")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const timerDisplayRef = useRef<HTMLDivElement>(null)
  const equalizerRef = useRef<HTMLDivElement>(null)

  // Initialize and update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === "pomodoro" || mode === "break") {
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

  const handleModeChange = (newMode: "pomodoro" | "break" | "flow") => {
    setMode(newMode)
    setIsRunning(false)
    if (newMode === "pomodoro") {
      setSeconds(25 * 60)
    } else if (newMode === "break") {
      setSeconds(5 * 60)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    if (mode === "pomodoro") {
      setSeconds(25 * 60)
    } else if (mode === "break") {
      setSeconds(5 * 60)
    } else {
      setFlowSeconds(0)
    }
  }

  const toggleMusic = () => {
    if (!audioRef.current) return
    if (isMusicPlaying) {
      audioRef.current.pause()
      setIsMusicPlaying(false)
    } else {
      audioRef.current.volume = volume
      audioRef.current.play().then(() => {
        setIsMusicPlaying(true)
      }).catch((err) => {
        console.error("Audio playback error:", err)
      })
    }
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (audioRef.current) {
      audioRef.current.volume = newVol
    }
  }

  // GSAP ScrollTrigger entrance
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          animate: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as { reduceMotion: boolean }

          if (reduceMotion) {
            gsap.set([".demo-header", ".demo-card"], { autoAlpha: 1, y: 0, clearProps: "all" })
            return
          }

          gsap.from(".demo-header", {
            y: 22,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 88%",
              once: true,
            },
          })

          gsap.from(".demo-card", {
            y: 24,
            autoAlpha: 0,
            scale: 0.985,
            duration: 1.05,
            ease: "power3.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 82%",
              once: true,
            },
          })
        }
      )
    },
    { scope: sectionRef }
  )

  // GSAP Lofi Equalizer Bars animation
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (!equalizerRef.current) return

        const bars = equalizerRef.current.querySelectorAll(".eq-bar")
        if (isMusicPlaying) {
          bars.forEach((bar, index) => {
            gsap.to(bar, {
              scaleY: 0.2 + ((index + 1) * 0.2),
              duration: 0.25 + (index * 0.08),
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              transformOrigin: "bottom center",
            })
          })
        } else {
          gsap.killTweensOf(bars)
          gsap.to(bars, {
            scaleY: 0.2,
            duration: 0.3,
            ease: "power1.out",
            transformOrigin: "bottom center",
          })
        }
      })
    },
    { scope: sectionRef, dependencies: [isMusicPlaying], revertOnUpdate: true }
  )

  // Subtle pulse animation on timer digits when mode changes
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (timerDisplayRef.current) {
          gsap.fromTo(
            timerDisplayRef.current,
            { scale: 0.96, autoAlpha: 0.8 },
            { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(1.5)" }
          )
        }
      })
    },
    { scope: sectionRef, dependencies: [mode], revertOnUpdate: true }
  )

  const tasks = [
    "Landing Page Design",
    "Focus Shield Integration",
    "Cross-Platform Monorepo Sync",
    "Lofi Player",
  ]

  return (
    <section ref={sectionRef} id="interactive-demo" className="py-20 relative">
      {/* Audio Element for Lofi Beats */}
      <audio ref={audioRef} src="/shortlofi.mp3" loop preload="auto" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="demo-header text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <span>Live Interactive Demo</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Try the Focus Timer
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Test Pomodoro, Break, and Flow modes with intelligent break calculation and adjustable Lofi music.
          </p>
        </div>

        {/* Demo Card */}
        <div className="demo-card max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Mode Switcher Bar */}
          <div className="flex items-center justify-center gap-1 mb-6 p-1 bg-muted/60 rounded-xl max-w-xs sm:max-w-sm mx-auto border border-border/50">
            <button
              onClick={() => handleModeChange("pomodoro")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === "pomodoro"
                  ? "bg-background text-foreground border border-border shadow-sm scale-100"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Timer className="size-3.5" />
              <span>Pomodoro</span>
            </button>
            <button
              onClick={() => handleModeChange("break")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === "break"
                  ? "bg-background text-foreground border border-border shadow-sm scale-100"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Coffee className="size-3.5" />
              <span>Break</span>
            </button>
            <button
              onClick={() => handleModeChange("flow")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === "flow"
                  ? "bg-background text-foreground border border-border shadow-sm scale-100"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-3.5" />
              <span>Flow</span>
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
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedTask === task
                      ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {selectedTask === task && <CheckCircle className="inline size-3 mr-1" />}
                  {task}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center my-6">
            <div
              ref={timerDisplayRef}
              className={`text-[4rem] sm:text-[5.5rem] md:text-[7rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow select-none font-mono transition-opacity ${
                isRunning ? "opacity-100" : "opacity-90"
              }`}
            >
              {mode === "flow" ? formatTime(flowSeconds) : formatTime(seconds)}
            </div>

            {mode === "flow" && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-lg border border-border shadow-sm">
                <Calculator className="size-3.5 text-primary" />
                <span>Calculated Break: {calculatedBreakMins} min</span>
              </div>
            )}

            {/* Timer Controls */}
            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
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
                className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
                title="Reset Timer"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          {/* Music & Volume Control Bar */}
          <div className="mt-8 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isMusicPlaying && volume > 0 ? (
                  <Volume2 className="size-4 text-foreground animate-pulse" />
                ) : (
                  <VolumeX className="size-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium text-foreground">Music:</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Volume Slider Control */}
                <div className="flex items-center gap-2 bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border/60">
                  <Volume2 className="size-3 text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />
                  <span className="text-[10px] font-mono text-muted-foreground min-w-[28px] text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                {/* Play / Pause Toggle Button with Equalizer Wave */}
                <button
                  onClick={toggleMusic}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isMusicPlaying
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Headphones className="size-3.5" />
                  <span>{isMusicPlaying ? "Playing Lofi" : "Play Lofi"}</span>

                  {/* Equalizer Visualizer Bars */}
                  <div ref={equalizerRef} className="flex items-end gap-0.5 h-3 w-4 px-0.5">
                    <span className="eq-bar w-0.5 h-full bg-current rounded-full origin-bottom scale-y-[0.2]" />
                    <span className="eq-bar w-0.5 h-full bg-current rounded-full origin-bottom scale-y-[0.2]" />
                    <span className="eq-bar w-0.5 h-full bg-current rounded-full origin-bottom scale-y-[0.2]" />
                    <span className="eq-bar w-0.5 h-full bg-current rounded-full origin-bottom scale-y-[0.2]" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
