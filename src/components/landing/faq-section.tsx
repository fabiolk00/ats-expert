"use client"

import { motion } from "motion/react"

import { landingFaqs } from "@/components/landing/faq-content"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function FaqSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24">
      <div className="container relative z-10 mx-auto max-w-4xl px-4">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">Perguntas Frequentes</h2>
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            Tudo o que você precisa saber sobre a otimização de currículos e o CurrIA.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl border bg-card p-6 shadow-sm md:p-8"
        >
          <Accordion type="single" collapsible className="w-full">
            {landingFaqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className="py-5 text-left text-lg font-semibold transition-colors hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
