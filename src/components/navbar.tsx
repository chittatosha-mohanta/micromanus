'use client';

import { useUser } from '@/hooks/use-user';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Coins, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { data: user } = useUser();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Credits */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
          <Coins className="w-3.5 h-3.5" />
          {user?.credits?.toFixed(2) ?? '0.00'} credits
        </div>

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden"
            id="user-avatar-btn"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || ''} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 w-48 rounded-xl border border-border bg-card shadow-xl z-50 py-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                  id="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
