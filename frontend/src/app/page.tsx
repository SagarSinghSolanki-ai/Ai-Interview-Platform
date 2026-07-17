import Link from "next/link"
import { ShieldCheck, MessageSquareCode, Award, Terminal } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-neutral-800 backdrop-blur-md sticky top-0 z-50 bg-neutral-950/80">
        <Link className="flex items-center justify-center space-x-2" href="#">
          <MessageSquareCode className="h-6 w-6 text-purple-500" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            AI Interviewer
          </span>
        </Link>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold hover:text-purple-400 transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-all shadow-md shadow-purple-500/20"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Main Hero */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 px-6 text-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" /> Next-Gen AI Interviewing
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Ace Your Next Tech Interview with{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
                Gemini AI
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-neutral-400 md:text-xl leading-relaxed">
              Practice real-time technical, coding, and behavioral interviews. Get instant structural score assessment
              and comprehensive, question-by-question feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/register"
                className="px-8 py-3 text-base font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20"
              >
                Start Practicing Free
              </Link>
              <Link
                href="/coding"
                className="px-8 py-3 text-base font-semibold border border-neutral-700 hover:bg-neutral-900 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Terminal className="h-5 w-5 text-purple-400" /> Open Code Sandbox
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <div className="flex flex-col items-center p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-purple-500/30 transition-all group">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <MessageSquareCode className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mt-4">Interactive AI Loops</h3>
              <p className="text-neutral-400 mt-2 text-sm text-center">
                Gemini asks questions, listens to answers, and queries contextual follow-ups just like a human interviewer.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-purple-500/30 transition-all group">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Terminal className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mt-4">Judge0 Code Execution</h3>
              <p className="text-neutral-400 mt-2 text-sm text-center">
                Write solutions inside a Monaco editor sandbox, run tests, and compile in real-time in multiple coding languages.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:border-purple-500/30 transition-all group">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Award className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mt-4">Actionable Feedback</h3>
              <p className="text-neutral-400 mt-2 text-sm text-center">
                Receive structured scores (technical, communication) strengths, weaknesses, and optimization suggestions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 w-full shrink-0 border-t border-neutral-800 px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 gap-4 bg-neutral-950">
        <p>© 2026 AI Interviewer. All rights reserved.</p>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="hover:text-purple-400 transition-colors" href="#">
            Terms of Service
          </Link>
          <Link className="hover:text-purple-400 transition-colors" href="#">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
