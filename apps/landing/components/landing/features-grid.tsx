"use client"

import { Timer, Shield, CheckSquare, Music, BarChart3, Heart, Zap, Sparkles } from "lucide-react"

export function FeaturesGrid() {
  const features = [
    {
      icon: Timer,
      title: "Smart Flow & Pomodoro Timers",
      subtitle: "Flexible focus modes tailored to your work style",
      description:
        "Switch between traditional 25-minute Pomodoro sprints or continuous Flow mode. Flow mode automatically calculates your break length as 1/5th of your session (e.g. 50 mins flow = 10 mins break).",
      gradient: "from-indigo-500/20 via-purple-500/20 to-pink-500/20",
      badge: "Smart Break Formula",
    },
    {
      icon: Shield,
      title: "Focus Shield Site Blocker",
      subtitle: "Eliminate web distractions on Chrome, Edge & Firefox",
      description:
        "Built-in browser extension shield that blocks distracting websites during active sessions. Supports soft nudges or hard block modes with custom domain blocklists.",
      gradient: "from-blue-500/20 via-indigo-500/20 to-violet-500/20",
      badge: "Browser Extension",
    },
    {
      icon: CheckSquare,
      title: "Session-Linked Tasks",
      subtitle: "Connect your to-dos directly to your timers",
      description:
        "Group tasks into custom categories, set estimated pomodoros, and assign subtasks. Finishing a timer session can auto-mark your linked task as completed.",
      gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
      badge: "Task Sync",
    },
    {
      icon: Music,
      title: "Ambient Audio & Dynamic Themes",
      subtitle: "Immersive soundscapes and serene visual backgrounds",
      description:
        "Listen to rainfall, cozy cafes, lo-fi tracks, and ocean waves while focusing. Choose from customizable aesthetic dark gradients, mountain landscapes, and lo-fi rooms.",
      gradient: "from-amber-500/20 via-orange-500/20 to-red-500/20",
      badge: "Audio Player",
    },
    {
      icon: BarChart3,
      title: "Deep Analytics & Streaks",
      subtitle: "Track your focus minutes, streaks, and trends",
      description:
        "Visualize your daily focus velocity, task completion rate, current streak metrics, and peak focus hours across all your connected devices.",
      gradient: "from-pink-500/20 via-rose-500/20 to-purple-500/20",
      badge: "Analytics Engine",
    },
    {
      icon: Heart,
      title: "Mood & Daily Reflections",
      subtitle: "Journal your state of mind after sessions",
      description:
        "Log your energy level and mood after every focus block. Discover which times of day yield your highest focus outputs and flow state retention.",
      gradient: "from-violet-500/20 via-purple-500/20 to-indigo-500/20",
      badge: "Mindfulness",
    },
  ]

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles className="size-3.5" />
            <span>Built for Uninterrupted Flow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Everything You Need to Master Your Time
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            A comprehensive set of tools designed to remove friction, defeat procrastination, and optimize your focus.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative bg-card border border-border/60 rounded-3xl p-8 hover:border-indigo-500/50 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle Hover Gradient */}
                <div
                  className={`absolute -right-20 -bottom-20 size-60 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="size-6" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground px-2.5 py-1 rounded-full bg-muted border border-border/40">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-indigo-500 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-1 mb-3">
                    {feature.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground/90 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
