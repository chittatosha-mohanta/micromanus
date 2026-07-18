'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, DollarSign, Coins, Activity, Zap, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useState } from 'react';

interface UsageData {
  summary: {
    totalCost: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCachedTokens: number;
    totalRequests: number;
    creditsRemaining: number;
  };
  dailyUsage: Array<{
    date: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
  modelUsage: Array<{
    model: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
  topChats: Array<{
    id: string;
    title: string;
    model: string | null;
    totalTokens: number;
    totalCost: number;
  }>;
}

const CHART_COLORS = [
  'hsl(258, 90%, 66%)',
  'hsl(200, 90%, 60%)',
  'hsl(330, 80%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 80%, 60%)',
];

export default function UsagePage() {
  const [period, setPeriod] = useState('30');
  const { data, isLoading } = useQuery<UsageData>({
    queryKey: ['usage', period],
    queryFn: async () => {
      const res = await fetch(`/api/usage?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json();
    },
  });

  const statCards = data
    ? [
        { label: 'Total Cost', value: formatCurrency(data.summary.totalCost), icon: DollarSign, color: 'text-red-400' },
        { label: 'Credits Remaining', value: data.summary.creditsRemaining.toFixed(2), icon: Coins, color: 'text-primary' },
        { label: 'Total Tokens', value: formatNumber(data.summary.totalPromptTokens + data.summary.totalCompletionTokens), icon: Activity, color: 'text-blue-400' },
        { label: 'Total Requests', value: formatNumber(data.summary.totalRequests), icon: Zap, color: 'text-yellow-400' },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Usage Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Track costs, tokens, and model usage.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none"
          id="period-select"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !data ? (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No usage data yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border/50 bg-card/30 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Cost Chart */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <h3 className="text-sm font-semibold mb-4">Daily Cost</h3>
              {data.dailyUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.dailyUsage}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="cost" stroke="hsl(258, 90%, 66%)" fill="url(#costGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                  No data for this period
                </div>
              )}
            </div>

            {/* Model Usage Pie Chart */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <h3 className="text-sm font-semibold mb-4">Model Usage</h3>
              {data.modelUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.modelUsage}
                      dataKey="requests"
                      nameKey="model"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {data.modelUsage.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                  No data for this period
                </div>
              )}
              {data.modelUsage.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {data.modelUsage.map((model, i) => (
                    <div key={model.model} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{model.model}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Token Usage Bar Chart */}
          <div className="rounded-xl border border-border/50 bg-card/30 p-6">
            <h3 className="text-sm font-semibold mb-4">Daily Token Usage</h3>
            {data.dailyUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="tokens" fill="hsl(200, 90%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No data for this period
              </div>
            )}
          </div>

          {/* Top Chats Table */}
          {data.topChats.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card/30 p-6">
              <h3 className="text-sm font-semibold mb-4">Top Chats by Cost</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Chat</th>
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Model</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Tokens</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topChats.map((chat) => (
                      <tr key={chat.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                        <td className="py-2 px-3 truncate max-w-[200px]">{chat.title}</td>
                        <td className="py-2 px-3 text-muted-foreground">{chat.model || '-'}</td>
                        <td className="py-2 px-3 text-right">{formatNumber(chat.totalTokens)}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(chat.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
