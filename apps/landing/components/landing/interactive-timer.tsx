"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle, Calculator, Headphones } from "lucide-react"

export function InteractiveTimer() {
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [flowSeconds, setFlowSeconds] = useState<number>(0)
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(0.5) // Default volume at 50%
  const [selectedTask, setSelectedTask] = useState<string>("Landing Page Design")
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
        setFlowSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const calculatedBreakMins = Math.max(1, Math.round(flowSeconds / 5 / 60))

  const resetTimer = () => {
    setIsRunning(false)
    setFlowSeconds(0)
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

  const tasks = [
    "Landing Page Design",
    "Focus Shield Integration",
    "Cross-Platform Monorepo Sync",
    "Lofi Player",
  ]

  return (
    <section id="interactive-demo" className="py-20 relative">
      {/* Audio Element for Lofi Beats */}
      <audio ref={audioRef} src="/shortlofi.mp3" loop preload="auto" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <span>Live Interactive Demo</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Try the Focus Timer
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Test Flow mode with intelligent break calculation and adjustable Lofi music.
          </p>
        </div>

        {/* Demo Card */}
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8">
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
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
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

          {/* Timer Display (No Circle) */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="text-[4rem] sm:text-[5.5rem] md:text-[7rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow select-none font-mono">
              {formatTime(flowSeconds)}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-lg border border-border">
              <Calculator className="size-3.5 text-primary" />
              <span>Calculated Break: {calculatedBreakMins} min</span>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity"
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
                className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
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
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />
                  <span className="text-[10px] font-mono text-muted-foreground min-w-[28px] text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                {/* Play / Pause Toggle Button */}
                <button
                  onClick={toggleMusic}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isMusicPlaying
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Headphones className="size-3.5" />
                  <span>{isMusicPlaying ? "Playing Lofi-Beats" : "Play Lofi-Beats"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
