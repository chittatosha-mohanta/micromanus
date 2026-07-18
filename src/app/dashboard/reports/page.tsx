'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

interface Report {
  id: string;
  title: string;
  content: string;
  chatId: string | null;
  createdAt: string;
}

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDownload = (report: Report) => {
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Research Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download and review your generated research reports.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No reports yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ask the agent to &quot;create a report&quot; during a research session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{report.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(report.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-accent transition-colors"
                  >
                    {expandedId === report.id ? 'Hide' : 'Preview'}
                  </button>
                  <button
                    onClick={() => handleDownload(report)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1"
                    id={`download-report-${report.id}`}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
              {expandedId === report.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-border/50 p-4 max-h-96 overflow-auto"
                >
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono">
                    {report.content}
                  </pre>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
