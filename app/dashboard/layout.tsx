// app/dashboard/layout.tsx
'use client'
import Loader from "@/src/components/Loader"
import { useState, useEffect } from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500) // simulate loading
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen flex-col gap-5">
        <Loader/>
        <h1 className="md:text-3xl text-lg font-bold font-mono">Preparing your DocuMind workspace…</h1>
      </main>
    )
  }

  return <>{children}</>
}
