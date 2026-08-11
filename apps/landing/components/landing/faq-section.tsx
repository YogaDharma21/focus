"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "How does the Smart Flow Break Calculation work?",
      answer:
        "When using Flow mode (stopwatch mode), Focus tracks how long you've been in flow state continuously. Once you finish your session, Focus automatically calculates your break length as 1/5th (20%) of your active flow time. For example, a 50-minute flow session results in a 10-minute break.",
    },
    {
      question: "What is Focus Shield and how does it block websites?",
      answer:
        "Focus Shield is the built-in site blocking module in the Focus Browser Extension (apps/extension). It actively monitors tab navigation during active timer sessions. You can configure custom domain blocklists (e.g. social media, news sites) and choose between soft warning screens or hard block modes.",
    },
    {
      question: "Can I use Focus offline on Desktop and Mobile?",
      answer:
        "Yes! Focus Desktop (Electron) and Focus Mobile (Expo / React Native) store session data, ambient sound files, and task entries locally. Your data persists offline and automatically synchronizes when internet connectivity is re-established.",
    },
    {
      question: "Is Focus open source?",
      answer:
        "Yes, Focus is 100% open source under the MIT License! The entire codebase — including the Next.js web app, Expo mobile app, Electron desktop app, and Manifest V3 extension — lives in a clean polyglot monorepo.",
    },
    {
      question: "Can I link my tasks directly to my Pomodoro / Flow timer sessions?",
      answer:
        "Absolutely. In all Focus apps, you can attach any task to your current timer session. As you complete timer sessions, Focus tracks estimated vs actual pomodoros and can automatically mark linked tasks as completed.",
    },
  ]

  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-4">
            <HelpCircle className="size-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Everything you need to know about the Focus app ecosystem and how it powers deep work.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={faq.question}
                className="bg-card border border-border/60 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground hover:text-indigo-500 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-indigo-500" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
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
