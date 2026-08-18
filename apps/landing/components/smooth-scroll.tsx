"use client"

import { useEffect, useRef } from "react"
import Lenis from "lenis"
import { gsap, ScrollTrigger } from "@/lib/gsap"

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Respect prefers-reduced-motion: if user wants reduced motion, use native scroll
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      ScrollTrigger.refresh()
      return
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    })
    lenisRef.current = lenis

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update)

    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tickerUpdate)
    gsap.ticker.lagSmoothing(0)

    // Handle smooth scrolling for anchor links (e.g. #ecosystem, #interactive-demo)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const anchor = target?.closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (href && href.startsWith("#") && href.length > 1) {
        const targetElement = document.querySelector(href)
        if (targetElement) {
          e.preventDefault()
          lenis.scrollTo(targetElement as HTMLElement, { offset: -70, duration: 1.1 })
        }
      }
    }

    document.addEventListener("click", handleAnchorClick)

    // Refresh ScrollTrigger after initial mount and layout calculations
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 150)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("click", handleAnchorClick)
      gsap.ticker.remove(tickerUpdate)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
