'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Key, Plus, Trash2, Moon, Sun, Monitor, CreditCard,
  Loader2, Shield, DollarSign, Clock, CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatDate, getProviderIcon } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';

interface ApiKeyEntry {
  id: string;
  provider: string;
  maskedKey: string;
  label: string | null;
  endpoint: string | null;
  model: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PaymentEntry {
  id: string;
  amount: number;
  currency: string;
  status: string;
  creditsAdded: number;
  createdAt: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  // ── API Keys ───────────────────────────────────────────────────────────────
  const { data: apiKeys, isLoading: keysLoading } = useQuery<ApiKeyEntry[]>({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const res = await fetch('/api/api-keys');
      if (!res.ok) throw new Error('Failed to fetch API keys');
      return res.json();
    },
  });

  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({
    provider: 'OPENAI',
    apiKey: '',
    label: '',
    endpoint: '',
    model: '',
  });

  const addKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      setShowAddKey(false);
      setNewKey({ provider: 'OPENAI', apiKey: '', label: '', endpoint: '', model: '' });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`/api/api-keys?id=${keyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete key');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
  });

  // ── Payment History ────────────────────────────────────────────────────────
  const { data: payments } = useQuery<PaymentEntry[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await fetch('/api/payments/history');
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, API keys, and preferences.</p>
      </div>

      {/* ── API Keys ─────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
      >
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">API Keys</h2>
                <p className="text-xs text-muted-foreground">Manage your AI provider keys. Encrypted with AES-256-GCM.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddKey(!showAddKey)}
              className="px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1"
              id="add-key-btn"
            >
              <Plus className="w-3 h-3" /> Add Key
            </button>
          </div>
        </div>

        {/* Add Key Form */}
        {showAddKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="p-6 border-b border-border/50 bg-secondary/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Provider</label>
                <select
                  value={newKey.provider}
                  onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  id="key-provider-select"
                >
                  <option value="OPENAI">OpenAI</option>
                  <option value="ANTHROPIC">Anthropic</option>
                  <option value="KIMI">Kimi</option>
                  <option value="CUSTOM">Custom (OpenAI-compatible)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Label (optional)</label>
                <input
                  type="text"
                  value={newKey.label}
                  onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                  placeholder="My API Key"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">API Key</label>
                <input
                  type="password"
                  value={newKey.apiKey}
                  onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  id="api-key-input"
                />
              </div>
              {newKey.provider === 'CUSTOM' && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Endpoint URL</label>
                    <input
                      type="url"
                      value={newKey.endpoint}
                      onChange={(e) => setNewKey({ ...newKey, endpoint: e.target.value })}
                      placeholder="https://api.example.com/v1"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Model</label>
                    <input
                      type="text"
                      value={newKey.model}
                      onChange={(e) => setNewKey({ ...newKey, model: e.target.value })}
                      placeholder="model-name"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddKey(false)}
                className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => addKeyMutation.mutate()}
                disabled={!newKey.apiKey || addKeyMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                id="save-key-btn"
              >
                {addKeyMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                <Shield className="w-3 h-3" /> Save Encrypted
              </button>
            </div>
            {addKeyMutation.error && (
              <p className="text-xs text-destructive mt-2">{addKeyMutation.error.message}</p>
            )}
          </motion.div>
        )}

        {/* Key List */}
        <div className="divide-y divide-border/30">
          {keysLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            </div>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No API keys added. Add one to start using MicroManus.
            </div>
          ) : (
            apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getProviderIcon(key.provider)}</span>
                  <div>
                    <p className="text-sm font-medium">{key.label || key.provider}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.maskedKey}</p>
                  </div>
                  {key.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">Active</span>
                  )}
                </div>
                <button
                  onClick={() => deleteKeyMutation.mutate(key.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* ── Theme ────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border/50 bg-card/30 p-6"
      >
        <h2 className="font-semibold mb-4">Appearance</h2>
        <div className="flex gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${
                theme === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </motion.section>

      {/* ── Credits ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border/50 bg-card/30 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Credits</h2>
          <span className="text-2xl font-bold text-primary">{user?.credits?.toFixed(2) ?? '0.00'}</span>
        </div>
        <a
          href="/paywall"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          id="buy-credits-btn"
        >
          <CreditCard className="w-4 h-4" /> Purchase Credits
        </a>
      </motion.section>

      {/* ── Payment History ──────────────────────────────────────────────── */}
      {payments && payments.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border/50 bg-card/30 overflow-hidden"
        >
          <div className="p-6 border-b border-border/50">
            <h2 className="font-semibold">Payment History</h2>
          </div>
          <div className="divide-y divide-border/30">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    {payment.status === 'SUCCEEDED' ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Clock className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  payment.status === 'SUCCEEDED'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h2 className="font-semibold text-destructive mb-2">Danger Zone</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Permanently delete your account and all associated data.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Are you sure? This action cannot be undone.')) {
              // Delete account logic
              alert('Account deletion would be processed here.');
            }
          }}
          className="px-4 py-2 rounded-lg text-sm border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          id="delete-account-btn"
        >
          Delete Account
        </button>
      </motion.section>
    </div>
  );
}
