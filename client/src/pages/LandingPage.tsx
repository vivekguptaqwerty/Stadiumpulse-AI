import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Smartphone, BarChart3, Database } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#090f24] to-[#020617] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-brand-primary/30 selection:text-white">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-brand-primary animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Stadium<span className="text-brand-primary">Pulse</span> AI
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm text-slate-400 font-medium">
            <Link to="/fan" className="hover:text-white transition-colors">PulseGuide</Link>
            <Link to="/ops" className="hover:text-white transition-colors">PulseOps</Link>
            <Link to="/ops/simulator" className="hover:text-white transition-colors">Digital Twin</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left copy */}
        <div className="lg:col-span-7 space-y-8 flex flex-col justify-center text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex self-center lg:self-start items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-semibold text-brand-primary"
          >
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
            </span>
            <span>FIFA World Cup 2026 Ready</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white"
          >
            See the stadium before <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              problems become critical.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed"
          >
            Powered by Gemini intelligence, StadiumPulse AI analyzes live stadium signals to generate grounded fan guidance and predictive operational recommendations.
          </motion.p>

          <div className="border-l-2 border-brand-primary/45 pl-4 text-xs md:text-sm text-slate-400 leading-relaxed font-light">
            <strong>Grounded Decision-Support</strong>: Gemini receives live gate densities, queue wait times, and incident reports. It generates contextual directions for fans and actionable mitigation plans for stadium coordinators.
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link
              to="/ops"
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/95 hover:shadow-lg hover:shadow-brand-primary/25 transition-all text-center"
            >
              Open Command Center
            </Link>
            <Link
              to="/fan"
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium hover:bg-slate-750 hover:text-white transition-all text-center"
            >
              Try Fan Assistant
            </Link>
          </motion.div>
        </div>

        {/* Right visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 flex justify-center items-center"
        >
          <div className="relative w-full max-w-[420px] aspect-square rounded-2xl border border-slate-800 bg-[#0f172a]/40 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
            
            {/* Mock Header in Viz */}
            <div className="flex justify-between items-center z-10">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">MetLife Live Twin</span>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            {/* Stadium Visual Schematic (Subtle pulsing SVGs) */}
            <div className="flex-grow flex justify-center items-center relative z-10 my-4">
              <svg className="w-full max-w-[260px] aspect-square" viewBox="0 0 100 100">
                {/* Stadium Outer Ring */}
                <circle cx="50" cy="50" r="44" fill="none" stroke="#334155" strokeWidth="0.75" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                
                {/* Pulsing Risk Zones */}
                {/* Zone B - East Concourse (Elevated) */}
                <path d="M 50 50 L 94 50 A 44 44 0 0 1 50 94 Z" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="0.75" />
                <circle cx="70" cy="70" r="3" fill="#f59e0b" className="animate-pulse" />
                
                {/* Corridor B2 surge indicator */}
                <circle cx="80" cy="60" r="1.5" fill="#ef4444" className="animate-live-pulse" />
                <circle cx="82" cy="58" r="1.5" fill="#ef4444" className="animate-live-pulse" />
                
                {/* Other zones (Normal) */}
                {/* Zone A (West Concourse) */}
                <path d="M 50 50 L 6 50 A 44 44 0 0 1 50 6 Z" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" strokeWidth="0.5" />
                <circle cx="28" cy="28" r="2.5" fill="#10b981" />
                
                {/* Zone C (North) */}
                <path d="M 50 50 L 50 6 A 44 44 0 0 1 94 50 Z" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" strokeWidth="0.5" />
                <circle cx="70" cy="28" r="2.5" fill="#10b981" />
                
                {/* Zone D (South) */}
                <path d="M 50 50 L 6 50 A 44 44 0 0 0 50 94 Z" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" strokeWidth="0.5" />
                <circle cx="28" cy="70" r="2.5" fill="#10b981" />
                
                {/* Central Pitch */}
                <rect x="36" y="28" width="28" height="44" rx="2" fill="none" stroke="#475569" strokeWidth="0.75" transform="rotate(45 50 50)" />
                <line x1="36" y1="50" x2="64" y2="50" stroke="#475569" strokeWidth="0.5" transform="rotate(45 50 50)" />
                <circle cx="50" cy="50" r="5" fill="none" stroke="#475569" strokeWidth="0.5" />
              </svg>

              {/* Float info label overlay */}
              <div className="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-700/60 p-2.5 rounded font-mono text-[9px] text-slate-300 space-y-1">
                <div>Zone B Density: <span className="text-brand-warning">58%</span></div>
                <div>Active Alert: <span className="text-brand-danger">Corridor B2 Congestion</span></div>
              </div>
            </div>

            {/* Quick Metrics display */}
            <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-800/80 pt-4 z-10">
              <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
                <span className="block text-[10px] text-slate-500 uppercase">Risk Level</span>
                <span className="text-sm font-semibold text-brand-warning">ELEVATED</span>
              </div>
              <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
                <span className="block text-[10px] text-slate-500 uppercase">AI Confidence</span>
                <span className="text-sm font-semibold text-brand-primary">94.8%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Module Overview Section */}
      <section className="bg-slate-950/60 border-y border-slate-900 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Smarter Stadium Intelligence</h2>
            <p className="text-slate-400 font-light text-sm md:text-base">
              A comprehensive stack tailored for World Cup 2026 venue optimization, stadium operations, and fan navigation safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* PulseGuide Card */}
            <div className="bg-slate-900/30 border border-slate-800/80 hover:border-brand-primary/40 rounded-xl p-6 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Smartphone className="h-5 w-5 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">PulseGuide</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4">
                  Context-aware multilingual stadium assistance. Helps fans navigate gates, facilities, steps, and transit queues with crowd-aware dynamic rerouting.
                </p>
              </div>
              <Link to="/fan" className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1 mt-2">
                Launch Fan Assistant &rarr;
              </Link>
            </div>

            {/* PulseOps Card */}
            <div className="bg-slate-900/30 border border-slate-800/80 hover:border-brand-primary/40 rounded-xl p-6 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">PulseOps</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4">
                  AI-powered operational intelligence and decision support. Real-time SVG digital schematic mapping risk levels, alerts, and recommended mitigation action plans.
                </p>
              </div>
              <Link to="/ops" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1 mt-2">
                Launch Command Center &rarr;
              </Link>
            </div>

            {/* PulseSim Card */}
            <div className="bg-slate-900/30 border border-slate-800/80 hover:border-brand-primary/40 rounded-xl p-6 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Database className="h-5 w-5 text-brand-warning" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">PulseSim</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4">
                  A digital stadium twin environment for testing live operational scenarios. Trigger crowd surges, medical issues, and accessibility bottlenecks to test AI reactions.
                </p>
              </div>
              <Link to="/ops/simulator" className="text-xs font-semibold text-brand-warning hover:underline flex items-center gap-1 mt-2">
                Launch Simulator &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950/80 text-xs text-center text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-brand-primary" />
            <span className="font-semibold text-slate-400">StadiumPulse AI</span>
            <span>&bull;</span>
            <span>Smarter, safer tournament operations.</span>
          </div>
          <span>FIFA World Cup 2026 Developer Challenge Project</span>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
