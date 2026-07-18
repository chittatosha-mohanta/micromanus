'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search, Brain, FileText, BarChart3, Shield, Zap,
  ArrowRight, Sparkles, Globe, ChevronRight
} from 'lucide-react';
import { Pricing, PricingPlan } from '@/components/pricing';
import { Marquee } from '@/components/ui/marquee';

const features = [
  {
    icon: Brain,
    title: 'Autonomous Agent',
    description: 'An AI that thinks, searches, reasons, and iterates — just like a human researcher.',
  },
  {
    icon: Search,
    title: 'Deep Internet Search',
    description: 'Searches multiple sources, reads full pages, and synthesizes information from across the web.',
  },
  {
    icon: FileText,
    title: 'PDF Reports',
    description: 'Generate professional research reports with executive summaries, citations, and structured sections.',
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    description: 'Track every token, every cost, every model. Full transparency into your AI usage.',
  },
  {
    icon: Shield,
    title: 'Your Keys, Your Data',
    description: 'Bring your own API keys. AES-256-GCM encrypted. Never stored in plaintext.',
  },
  {
    icon: Zap,
    title: 'Multi-Model Support',
    description: 'OpenAI, Anthropic Claude, Kimi, and any OpenAI-compatible endpoint.',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">MicroManus</span>
          </div>
          <Link
            href="/auth"
            className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
              <Globe className="w-3.5 h-3.5" />
              AI-Powered Deep Research Platform
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Research at the
            <br />
            <span className="gradient-text">Speed of Thought</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            MicroManus is an autonomous AI research agent that searches the internet,
            reads sources, reasons through findings, and delivers comprehensive answers
            with citations — all in seconds.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/auth"
              className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              Start Researching <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-3.5 rounded-full border border-border text-foreground font-medium text-base hover:bg-accent transition-colors flex items-center gap-2"
            >
              See Features <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Demo Preview ─────────────────────────────────────────────────── */}
        <motion.div
          className="max-w-5xl mx-auto mt-20 relative"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/20">
            <div className="h-10 bg-secondary/50 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-muted-foreground ml-3">MicroManus — Research Agent</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm">👤</span>
                </div>
                <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg">
                  <p className="text-sm">What are the latest breakthroughs in quantum computing in 2025?</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                    </div>
                    Searching 5 sources · Reading pages · Synthesizing...
                  </div>
                  <div className="bg-secondary/30 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm leading-relaxed">
                      <strong>Key Breakthroughs in Quantum Computing (2025):</strong>
                    </p>
                    <ul className="text-sm mt-2 space-y-1 list-disc pl-4 text-muted-foreground">
                      <li>Google&apos;s Willow chip achieves 105-qubit operations with below-threshold error correction...</li>
                      <li>Microsoft announces topological qubits achieving 99.8% gate fidelity...</li>
                      <li>IBM&apos;s 1,386-qubit Flamingo processor demonstrates practical advantage in materials simulation...</li>
                    </ul>
                    <p className="text-xs text-primary mt-3">[1] Nature · [2] MIT Tech Review · [3] ArXiv</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for
              <span className="gradient-text"> deep research</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete research platform with autonomous AI, internet search, report generation, and usage analytics.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Trusted By ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-y border-border/50 bg-secondary/20 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <h2 className="text-2xl font-bold mb-3">Trusted by developers worldwide</h2>
          <p className="text-muted-foreground">
            Join thousands of developers who are already building the future with our AI platform
          </p>
        </div>
        <div className="max-w-full mx-auto relative">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <Marquee pauseOnHover className="[--duration:20s]">
            {["Google", "Microsoft", "Amazon", "Meta", "Netflix", "Spotify", "Stripe", "Vercel", "Supabase", "OpenAI"].map((company) => (
              <div key={company} className="px-8 py-3 rounded-xl bg-card/50 border border-border/50 font-semibold text-lg text-muted-foreground shadow-sm flex items-center justify-center min-w-[150px]">
                {company}
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <Pricing
            title="Simple, Transparent Pricing"
            description="Choose the plan that works for you.\nAll plans include access to our autonomous research platform."
            plans={[
              {
                name: "STARTER",
                price: "5",
                yearlyPrice: "4",
                period: "per month",
                features: [
                  "Up to 10 projects",
                  "Basic analytics",
                  "48-hour support response time",
                  "Limited API access",
                  "Community support",
                ],
                description: "Perfect for individuals and small projects",
                buttonText: "Start Free Trial",
                href: "/auth",
                isPopular: false,
              },
              {
                name: "PROFESSIONAL",
                price: "79",
                yearlyPrice: "63",
                period: "per month",
                features: [
                  "Unlimited projects",
                  "Advanced analytics",
                  "24-hour support response time",
                  "Full API access",
                  "Priority support",
                  "Team collaboration",
                  "Custom integrations",
                ],
                description: "Ideal for growing teams and businesses",
                buttonText: "Get Started",
                href: "/auth",
                isPopular: true,
              },
              {
                name: "ENTERPRISE",
                price: "239",
                yearlyPrice: "191",
                period: "per month",
                features: [
                  "Everything in Professional",
                  "Custom solutions",
                  "Dedicated account manager",
                  "1-hour support response time",
                  "SSO Authentication",
                  "Advanced security",
                  "Custom contracts",
                  "SLA agreement",
                ],
                description: "For large organizations with specific needs",
                buttonText: "Contact Sales",
                href: "/auth",
                isPopular: false,
              },
            ]}
          />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">MicroManus</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MicroManus. Built with Next.js, Supabase, and AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
