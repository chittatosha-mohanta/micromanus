'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, FileText, BarChart3, Settings,
  Sparkles, Trash2, MoreHorizontal, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useChats, useCreateChat, useDeleteChat } from '@/hooks/use-chat';
import { formatRelativeTime, truncate } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: chats, isLoading } = useChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();
  const [collapsed, setCollapsed] = useState(false);

  const handleNewChat = async () => {
    const chat = await createChat.mutateAsync();
    router.push(`/dashboard/chat/${chat.id}`);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteChat.mutateAsync(chatId);
    if (pathname.includes(chatId)) {
      router.push('/dashboard');
    }
  };

  const navItems = [
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
    { href: '/dashboard/usage', icon: BarChart3, label: 'Usage' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <motion.aside
      className="h-screen flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm"
      animate={{ width: collapsed ? 60 : 280 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border/50 shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">MicroManus</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          id="toggle-sidebar-btn"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-2 shrink-0">
        <button
          onClick={handleNewChat}
          disabled={createChat.isPending}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors text-sm font-medium"
          id="new-chat-btn"
        >
          <Plus className="w-4 h-4" />
          {!collapsed && 'New Research'}
        </button>
      </div>

      {/* Chat List */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          <p className="text-xs text-muted-foreground font-medium px-3 py-2">Recent</p>
          {isLoading ? (
            <div className="space-y-1 px-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-secondary/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {chats?.map((chat) => (
                <motion.div
                  key={chat.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <Link
                    href={`/dashboard/chat/${chat.id}`}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname.includes(chat.id)
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{truncate(chat.title, 30)}</span>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {!isLoading && (!chats || chats.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No chats yet. Click &quot;New Research&quot; to start.
            </p>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="p-2 border-t border-border/50 space-y-0.5 shrink-0">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {!collapsed && item.label}
          </Link>
        ))}
      </div>
    </motion.aside>
  );
}
