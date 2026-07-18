'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Brain, Search, FileText } from 'lucide-react';
import { useCreateChat } from '@/hooks/use-chat';

export default function DashboardHome() {
  const router = useRouter();
  const createChat = useCreateChat();

  const handleNewChat = async () => {
    const chat = await createChat.mutateAsync();
    router.push(`/dashboard/chat/${chat.id}`);
  };

  const suggestions = [
    'What are the latest advancements in quantum computing?',
    'Compare React, Vue, and Angular in 2025',
    'Explain the current state of AGI research',
    'Create a report on renewable energy trends',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <motion.div
        className="max-w-2xl w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold mb-3">What would you like to research?</h1>
        <p className="text-muted-foreground mb-8">
          MicroManus searches the internet, reads sources, and delivers comprehensive answers.
        </p>

        {/* Quick Start */}
        <button
          onClick={handleNewChat}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25 mb-10"
          id="start-research-btn"
        >
          Start New Research <ArrowRight className="w-5 h-5" />
        </button>

        {/* Suggestion chips */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, i) => (
              <motion.button
                key={i}
                onClick={async () => {
                  const chat = await createChat.mutateAsync();
                  router.push(`/dashboard/chat/${chat.id}?q=${encodeURIComponent(suggestion)}`);
                }}
                className="px-4 py-2 rounded-full text-xs bg-secondary/50 border border-border/50 hover:bg-accent hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Feature icons */}
        <div className="flex items-center justify-center gap-8 mt-12 text-muted-foreground">
          <div className="flex flex-col items-center gap-1.5">
            <Brain className="w-5 h-5" />
            <span className="text-xs">Thinks</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Search className="w-5 h-5" />
            <span className="text-xs">Searches</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <FileText className="w-5 h-5" />
            <span className="text-xs">Reports</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
