'use client'

import Link from 'next/link'

const LandingPage = () => {
  return (
    <main className="bg-gradient-to-b from-white to-gray-50 text-gray-900 min-h-screen font-sans">

      {/* NAV */}
      <nav className="flex justify-between items-center md:px-12 py-6 px-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <span className="font-mono text-blue-600 md:text-lg">Docu<span className="text-purple-500">//</span>Mind</span>
        <div className="flex items-center md:gap-10 gap-4">
          <a href="#features" className="text-gray-600 px-2 hover:text-blue-600 md:text-sm uppercase tracking-widest transition-colors text-xs">Features</a>
          <a href="#how" className="text-gray-600 hover:text-blue-600 md:text-sm uppercase tracking-widest transition-colors text-xs">How it works</a>
          <Link href="/Login" className="bg-blue-600 text-white font-mono font-bold md:text-sm md:px-6 md:py-2 rounded hover:bg-blue-700 transition-colors text-xs py-2 px-2">
            Get started →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-[85vh] flex items-center px-10 md:py-24 py-12 relative">
        <div className="md:grid grid-cols-2 gap-20 items-center max-w-6xl mx-auto w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5 font-mono text-xs text-blue-600 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Upload PDFs, ask questions instantly
            </div>
            <h1 className="md:text-6xl text-3xl font-extrabold leading-[1.05] tracking-tight mb-6">
              AI answers <span className="text-purple-600">from your documents</span>
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md">
              Stop scrolling through endless pages. Upload a PDF and get instant, accurate answers powered by AI.
            </p>
            <div className="flex gap-4 items-center">
              <Link href="/Login" className="bg-purple-600 text-white font-mono font-bold md:px-6 md:py-3 px-3 py-2 rounded hover:bg-purple-700 transition-colors">
                Try it free →
              </Link>
              <a href="#features" className="text-blue-600 border border-blue-300 font-mono text-sm px-6 py-3 rounded hover:bg-blue-50 transition-colors">
                See features
              </a>
            </div>
            <p className="font-mono text-xs text-gray-500 mt-4">// Free forever. No credit card required.</p>
          </div>

          {/* DEMO CARD */}
          <div className="bg-black shadow-xl border border-gray-200 rounded-xl overflow-hidden font-mono text-sm">
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <span className="text-gray-600 text-xs ml-2">documind — pdf assistant</span>
            </div>
            <div className="p-6 leading-7">
              <div><span className="text-blue-600">→ </span><span className="text-purple-600">pdf.upload</span><span className="text-gray-200">( "research-paper.pdf" )</span></div>
              <div className="text-green-600">✓ file uploaded successfully</div>
              <br />
              <div><span className="text-blue-600">→ </span><span className="text-purple-600">ai.ask</span><span className="text-gray-200">( "Summarize section 3" )</span></div>
              <div className="text-gray-300">Answer: "Section 3 explains the methodology..."</div>
              <br />
              <div><span className="text-blue-600">→ </span><span className="text-purple-600">ai.ask</span><span className="text-gray-200">( "What are the key findings?" )</span></div>
              <div className="text-green-600">✓ extracted directly from PDF</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-blue-50 border-y border-gray-200 px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs text-blue-600 tracking-widest uppercase mb-3">// Features</p>
          <h2 className="text-4xl font-extrabold tracking-tight mb-3 text-gray-800">Smart tools for smarter reading</h2>
          <p className="text-gray-600 mb-12 max-w-lg">Interact with your PDFs like never before — powered by AI.</p>
          <div className="md:grid grid-cols-3 gap-6">
            {[
              { icon: "📄", title: "Upload PDFs", desc: "Drag and drop any PDF to start asking questions." },
              { icon: "🤖", title: "AI-powered Q&A", desc: "Ask natural language questions and get precise answers." },
              { icon: "🔍", title: "Context-aware search", desc: "Find exact sections without scrolling through pages." },
              { icon: "⚡", title: "Instant responses", desc: "Answers generated in seconds." },
              { icon: "🔐", title: "Secure by default", desc: "Your files stay private with encrypted storage." },
              { icon: "🗂️", title: "Multiple documents", desc: "Upload and query across several PDFs at once." },
            ].map((f) => (
              <div key={f.title} className="bg-white p-8 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold mb-2 text-gray-800">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-10 py-20 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs text-purple-600 tracking-widest uppercase mb-3">// How it works</p>
          <h2 className="text-4xl font-extrabold tracking-tight mb-6 text-gray-800">Get answers in 3 simple steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Upload your PDF", desc: "Drag and drop or select a file to begin." },
              { num: "02", title: "Ask your question", desc: "Type your query in plain English — no special syntax required." },
              { num: "03", title: "Get instant answers", desc: "AI extracts the relevant context and responds in seconds." },
            ].map((s) => (
              <div key={s.num} className="bg-white p-8 rounded-lg shadow hover:shadow-md transition-shadow text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center font-mono text-sm text-purple-600 mb-4">{s.num}</div>
                <h3 className="font-bold text-lg mb-2 text-gray-800">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
            {/* CTA */}
      <section className="text-center px-10 py-24 bg-blue-600 text-white">
        <p className="font-mono text-xs tracking-widest uppercase mb-4">// Get started</p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4">Stop searching, start asking</h2>
        <p className="text-blue-100 mb-8">Upload a PDF and get answers in seconds. Free forever, no credit card required.</p>
        <Link href="/Login" className=" text-white font-mono font-bold px-8 py-3 rounded hover:bg-gray-100 transition-colors text-sm">
          Try it now 📃
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white px-10 py-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-6">
          <div>
            <div className="font-mono text-blue-600">Docu<span className="text-purple-500">//</span>Mind</div>
            <div className="text-gray-500 text-xs mt-1">AI answers from your documents.</div>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Features</a>
            <a href="#how" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">How it works</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">GitHub</a>
          </div>
          <div className="font-mono text-xs text-gray-400">// built with Next.js + Supabase + Qdrant</div>
        </div>
      </footer>

    </main>
  )
}

export default LandingPage
