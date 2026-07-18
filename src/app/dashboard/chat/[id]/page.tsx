'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Square, Loader2, Sparkles, User, ChevronDown,
  ChevronRight, Search, Brain, FileText, Calculator, Quote, Globe,
  Copy, Check
} from 'lucide-react';
import { useMessages, useSendMessage } from '@/hooks/use-chat';
import { useUser } from '@/hooks/use-user';
import { ThinkingStep } from '@/agents/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Suspense } from 'react';

const toolIcons: Record<string, typeof Search> = {
  internet_search: Search,
  page_fetch: Globe,
  summarizer: FileText,
  calculator: Calculator,
  citation_collector: Quote,
  generate_report: FileText,
};

function ThinkingStepView({ step }: { step: ThinkingStep }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = step.toolName ? (toolIcons[step.toolName] || Brain) : Brain;

  const labels: Record<string, string> = {
    thinking: 'Analyzing...',
    reasoning: 'Reasoning',
    tool_call: `Using ${step.toolName || 'tool'}`,
    tool_result: `${step.toolName || 'Tool'} result`,
    final_answer: 'Final answer',
  };

  return (
    <div className="flex items-start gap-2 text-xs">
      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span>{labels[step.type] || step.type}</span>
        </button>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-1 px-2 py-1.5 rounded-md bg-secondary/30 text-muted-foreground overflow-auto max-h-40"
          >
            <pre className="whitespace-pre-wrap text-xs">{step.content?.substring(0, 500)}</pre>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-accent transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function ChatContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params.id as string;
  const { data: messages, isLoading: messagesLoading } = useMessages(chatId);
  const { data: user } = useUser();
  const { sendMessage, abort, isStreaming, streamContent, thinkingSteps, error } = useSendMessage();

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-send if query param present
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && messages && messages.length === 0) {
      setInput(q);
      setTimeout(() => {
        sendMessage(chatId, q, selectedModel, selectedProvider);
      }, 500);
    }
  }, [searchParams, messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamContent, thinkingSteps]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setInput('');
    sendMessage(chatId, msg, selectedModel, selectedProvider);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {messages?.filter((m) => m.role === 'USER' || m.role === 'ASSISTANT').map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-4xl mx-auto ${message.role === 'USER' ? 'justify-end' : ''}`}
              >
                {message.role === 'ASSISTANT' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] ${
                    message.role === 'USER'
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3'
                      : 'space-y-3'
                  }`}
                >
                  {message.role === 'USER' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <>
                      {/* Thinking steps */}
                      {message.thinkingSteps && Array.isArray(message.thinkingSteps) && message.thinkingSteps.length > 0 && (
                        <div className="space-y-1.5 mb-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Research Steps</p>
                          {(message.thinkingSteps as ThinkingStep[])
                            .filter((s) => s.type !== 'final_answer')
                            .map((step, i) => (
                              <ThinkingStepView key={i} step={step} />
                            ))}
                        </div>
                      )}

                      {/* Message content */}
                      <div className="prose-chat">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeHighlight]}
                          components={{
                            pre: ({ children }) => (
                              <div className="relative group">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={String((children as any)?.props?.children || '')} />
                                </div>
                                <pre>{children}</pre>
                              </div>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Copy full response */}
                      <div className="flex items-center gap-2 mt-2">
                        <CopyButton text={message.content} />
                        {message.cost > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ${message.cost.toFixed(6)} · {message.promptTokens + message.completionTokens} tokens
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {message.role === 'USER' && (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Streaming response */}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-4xl mx-auto"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-3 flex-1 max-w-[80%]">
                  {/* Live thinking steps */}
                  {thinkingSteps.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-secondary/20 border border-border/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                        Researching...
                      </p>
                      {thinkingSteps
                        .filter((s) => s.type !== 'final_answer')
                        .slice(-5) // Show last 5 steps
                        .map((step, i) => (
                          <ThinkingStepView key={i} step={step} />
                        ))}
                    </div>
                  )}

                  {/* Streaming content */}
                  {streamContent && (
                    <div className="prose-chat">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      >
                        {streamContent}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Typing indicator */}
                  {!streamContent && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
                      </div>
                      <span className="text-xs">Thinking...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="max-w-4xl mx-auto px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 md:px-8 pb-4 pt-2 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {/* Model selector */}
          <div className="flex items-center gap-2 mb-2">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="text-xs px-2 py-1 rounded-md bg-secondary/50 border border-border text-muted-foreground focus:outline-none"
              id="provider-select"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="kimi">Kimi</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs px-2 py-1 rounded-md bg-secondary/50 border border-border text-muted-foreground focus:outline-none"
              id="model-select"
            >
              {selectedProvider === 'openai' && (
                <>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4.1">GPT-4.1</option>
                  <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                  <option value="o3">o3</option>
                  <option value="o3-mini">o3 Mini</option>
                  <option value="o4-mini">o4 Mini</option>
                </>
              )}
              {selectedProvider === 'anthropic' && (
                <>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                  <option value="claude-opus-4-20250514">Claude Opus 4</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                </>
              )}
              {selectedProvider === 'kimi' && (
                <option value="kimi-k2">Kimi K2</option>
              )}
              {selectedProvider === 'custom' && (
                <option value="custom">Custom Model</option>
              )}
            </select>
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 focus-within:border-primary/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... What would you like to research?"
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none px-2 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/50 max-h-32"
              style={{ minHeight: '40px' }}
              disabled={isStreaming}
              id="chat-input"
            />
            {isStreaming ? (
              <button
                onClick={abort}
                className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                id="stop-btn"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                id="send-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-2">
            MicroManus can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
