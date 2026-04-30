import React, { useState } from 'react';
import { GitCommitHorizontal, Clock, User, ChevronRight, FileText } from 'lucide-react';
import { useData } from '@/context/DataContext';

export default function CommitHistory({ repoId }) {
  const { commits } = useData();
  const repoCommits = commits[repoId] || [];
  const [expandedCommit, setExpandedCommit] = useState(null);

  return (
    <div className="space-y-2">
      {repoCommits.length === 0 && (
        <p className="text-sm font-mono text-muted-foreground text-center py-8">No commits yet</p>
      )}
      {repoCommits.map((commit) => (
        <div key={commit.id} className="bg-secondary/50 rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setExpandedCommit(expandedCommit === commit.id ? null : commit.id)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/30 transition-colors"
          >
            <GitCommitHorizontal className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-foreground truncate">{commit.message}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground">
                <span className="text-primary/80">{commit.id}</span>
                <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{commit.author}</span>
                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{commit.timestamp}</span>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCommit === commit.id ? 'rotate-90' : ''}`} />
          </button>

          {expandedCommit === commit.id && (
            <div className="border-t border-border bg-background/50 p-3 space-y-2">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Diff Preview</p>
              {commit.files.map(file => (
                <div key={file} className="bg-secondary/50 rounded border border-border p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3 h-3 text-primary" />
                    <span className="font-mono text-xs text-foreground">{file}</span>
                  </div>
                  <div className="font-mono text-xs space-y-0.5">
                    <div className="flex">
                      <span className="w-6 text-right pr-2 text-muted-foreground/50 select-none">+</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded flex-1">// Changes applied</span>
                    </div>
                    <div className="flex">
                      <span className="w-6 text-right pr-2 text-muted-foreground/50 select-none">+</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded flex-1">// Updated by {commit.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}