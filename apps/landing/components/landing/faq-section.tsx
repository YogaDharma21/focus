"use client"

import { useState, useRef } from "react"
import { ChevronDown, HelpCircle, ExternalLink } from "lucide-react"
import { gsap, useGSAP } from "@/lib/gsap"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const sectionRef = useRef<HTMLElement>(null)

  const faqs = [
    {
      question: "How does the Smart Flow Break Calculation work?",
      answer:
        "When using Flow mode, Focus tracks how long you've been in flow state continuously. Once you finish your session, Focus automatically calculates your break length as 1/5th (20%) of your active flow time. For example, a 50-minute flow session results in a 10-minute break.",
    },
    {
      question: "Can I use the Web App directly in my browser?",
      answer:
        "Yes! You can launch the web application directly in any modern browser without installing anything.",
      hasWebLink: true,
    },
    {
      question: "What is Focus Shield and how does it block websites?",
      answer:
        "Focus Shield is the built-in site blocking module in the Focus Browser Extension (apps/extension). It actively monitors tab navigation during active timer sessions. You can configure custom domain blocklists with soft warnings or hard block modes.",
    },
    {
      question: "Can I use Focus offline on Desktop and Mobile?",
      answer:
        "Yes! Focus Desktop (Electron) and Focus Mobile (Expo / React Native) store session data, audio files, and task entries locally. Your data persists offline and automatically synchronizes when internet connectivity is available.",
    },
    {
      question: "Is Focus open source?",
      answer:
        "Yes, Focus is 100% open source under the MIT License! The entire codebase (including the Next.js web app, Expo mobile app, Electron desktop app, and Manifest V3 extension) lives in a clean unified repository.",
    },
  ]

  // ScrollTrigger entrance
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
            gsap.set([".faq-header", ".faq-item"], { autoAlpha: 1, y: 0, clearProps: "all" })
            return
          }

          gsap.from(".faq-header", {
            y: 30,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          })

          gsap.from(".faq-item", {
            y: 25,
            autoAlpha: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
          })
        }
      )
    },
    { scope: sectionRef }
  )

  return (
    <section ref={sectionRef} id="faq" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="faq-header text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <HelpCircle className="size-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Everything you need to know about Focus.
          </p>
        </div>

        {/* Accordion List */}
        <div className="faq-list space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={faq.question}
                className={`faq-item bg-card border rounded-xl overflow-hidden transition-all ${
                  isOpen ? "border-foreground/30 shadow-sm" : "border-border hover:border-border/80"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-foreground hover:text-primary transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-foreground" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3 flex flex-col gap-3">
                      <p>{faq.answer}</p>
                      {faq.hasWebLink && (
                        <a
                          href="https://focustracks.vercel.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium w-fit hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Launch Web App
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
