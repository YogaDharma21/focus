"use client"

import { useEffect, useState, useRef } from "react"
import { ArrowUp } from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap"

export function ScrollEffects() {
  const [showTopBtn, setShowTopBtn] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const topBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0

      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: progress,
          duration: 0.1,
          ease: "none",
          overwrite: "auto",
        })
      }

      setShowTopBtn(scrollY > 320)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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

          if (!topBtnRef.current) return

          if (reduceMotion) {
            gsap.set(topBtnRef.current, {
              autoAlpha: showTopBtn ? 1 : 0,
              display: showTopBtn ? "flex" : "none",
            })
            return
          }

          if (showTopBtn) {
            gsap.set(topBtnRef.current, { display: "flex" })
            gsap.to(topBtnRef.current, {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: "back.out(1.6)",
              overwrite: "auto",
            })
          } else {
            gsap.to(topBtnRef.current, {
              autoAlpha: 0,
              y: 16,
              scale: 0.88,
              duration: 0.3,
              ease: "power2.in",
              overwrite: "auto",
              onComplete: () => {
                if (topBtnRef.current) {
                  gsap.set(topBtnRef.current, { display: "none" })
                }
              },
            })
          }
        }
      )
    },
    { dependencies: [showTopBtn] }
  )

  const scrollToTop = () => {
    // If lenis is available globally on window or smoothly scroll
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <>
      {/* Sleek Top Reading Progress Bar */}
      <div
        ref={progressBarRef}
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-primary via-indigo-500 to-primary origin-left scale-x-0 z-[100] pointer-events-none shadow-[0_0_8px_rgba(99,102,241,0.5)]"
      />

      {/* Floating Back to Top Button */}
      <button
        ref={topBtnRef}
        onClick={scrollToTop}
        aria-label="Scroll back to top"
        style={{ display: "none", opacity: 0 }}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg hover:shadow-xl text-foreground hover:text-primary hover:border-primary/40 transition-all hover:scale-110 active:scale-95 group items-center justify-center"
      >
        <ArrowUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
      </button>
    </>
  )
}
