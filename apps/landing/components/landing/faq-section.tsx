"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "How does the Smart Flow Break Calculation work?",
      answer:
        "When using Flow mode, Focus tracks how long you've been in flow state continuously. Once you finish your session, Focus automatically calculates your break length as 1/5th (20%) of your active flow time. For example, a 50-minute flow session results in a 10-minute break.",
    },
    {
      question: "Where can I access the live Web App version?",
      answer:
        "The live web application is hosted at https://focustracks.vercel.app. You can use it directly in any modern browser without installing anything.",
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
        "Yes, Focus is 100% open source under the MIT License! The entire codebase — including the Next.js web app, Expo mobile app, Electron desktop app, and Manifest V3 extension — lives in a clean polyglot monorepo.",
    },
  ]

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-medium mb-3">
            <HelpCircle className="size-3.5" />
            <span>FAQ</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Everything you need to know about the Focus productivity suite.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={faq.question}
                className="bg-card border border-border rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-foreground" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
