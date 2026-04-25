"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

export function FloatingDecorations() {
  const [mounted, setMounted] = useState(false)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || prefersReduced) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 opacity-0 blur-3xl md:opacity-40 lg:opacity-60"
      />

      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          ease: "linear",
          repeat: Infinity,
        }}
        className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-secondary/5 opacity-0 blur-3xl md:opacity-30 lg:opacity-50"
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 15,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 opacity-0 blur-3xl lg:opacity-40"
      />
    </div>
  )
}
