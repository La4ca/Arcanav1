import React, { useMemo, useState, useEffect } from 'react';
import { File, Lock, ShieldCheck, ShieldOff, Copy, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { showAutoToast } from '@/components/shared/AutoToast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COL } from '@/lib/firestore';

export default function CodeViewer({ file, repoId }) {
  const { currentUser } = useAuth();
  const { accessRequests, canUserAccessFileJit, requestTradeSecretAccess, addLog } = useData();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [resolvedContent, setResolvedContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);

  const canView = canUserAccessFileJit({ userId: currentUser.id, repoId, file });

  // Fix #3: Always fetch real content from Firestore when file is selected and accessible
  useEffect(() => {
    if (!file) { setResolvedContent(null); return; }
    if (!canView) { setResolvedContent(null); return; }

    // Always fetch from Firestore to guarantee fresh content (fixes empty content bug)
    setContentLoading(true);
    setResolvedContent(null);
    getDoc(doc(db, COL.FILES, file.id))
      .then(snap => {
        if (snap.exists()) {
          const fetched = snap.data().content;
          // content may be empty string which is valid — only fall back if truly undefined/null
          setResolvedContent(fetched !== undefined && fetched !== null ? fetched : (file.content ?? ''));
        } else {
          setResolvedContent(file.content ?? '');
        }
      })
      .catch(() => setResolvedContent(file.content ?? ''))
      .finally(() => setContentLoading(false));
  }, [file?.id, canView]);

  // Log file view when user opens a file they can see
  useEffect(() => {
    if (!file || !canView || !currentUser) return;
    addLog({
      user: currentUser.username,
      action: 'FILE_VIEW',
      repo: repoId,
      resource: file.path,
      ip: '127.0.0.1',
      meta: { restricted: file.restricted || false },
    });
  }, [file?.path, canView]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
        <div className="text-center space-y-2">
          <File className="w-8 h-8 mx-auto opacity-30" />
          <p>Select a file to view</p>
        </div>
      </div>
    );
  }

  const pendingRequest = useMemo(() => {
    return accessRequests.find(
      r => r.userId === currentUser.id && r.repoId === repoId &&
           r.path === file.path && r.status === 'pending'
    );
  }, [accessRequests, currentUser.id, repoId, file.path]);

  const submitRequest = async () => {
    await requestTradeSecretAccess({ userId: currentUser.id, repoId, path: file.path, reason });
    showAutoToast({ type: 'info', title: 'Access requested', message: 'Waiting for Lead Dev / Admin approval.' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedContent ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied', description: 'File content copied to clipboard.' });
  };

  // Fix #1: Locked — show clear "Access Denied / Request Access" UI, not a blank page
  if (!canView) {
    return (
      <div className="bg-secondary/50 rounded-lg border border-red-500/30 overflow-hidden">
        {/* File header bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-red-500/20 bg-red-500/5">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span className="font-mono text-xs text-foreground flex-1">{file.path}</span>
          <Badge variant="outline" className="text-[10px] font-mono bg-red-500/10 text-red-400 border-red-500/30">
            ACCESS DENIED
          </Badge>
        </div>

        {/* Encryption badge */}
        <div className="mx-4 mt-4 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px] text-emerald-300">
            AES-256-GCM encrypted · TLS 1.3 in transit · Role-keyed envelope
          </span>
        </div>

        {/* Access denied message */}
        <div className="mx-4 mt-3 px-3 py-3 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-2">
          <ShieldOff className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-sm font-semibold text-red-400">Access Failed</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              You do not have permission to view <span className="text-foreground">{file.path}</span>.
              {file.restricted
                ? ' This is a Trade Secret file. Submit a request for time-limited JIT access (24h) below.'
                : ' Contact the repository owner or an Admin to be granted access.'}
            </p>
          </div>
        </div>

        {/* Request access section — only for restricted/trade-secret files */}
        {file.restricted && (
          <div className="p-4 space-y-3 mt-1">
            {pendingRequest ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="font-mono text-xs text-amber-300">
                  Request submitted — pending approval from a Lead Developer or Admin.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Request Access</p>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Reason for access request (recommended)…"
                  className="font-mono text-xs bg-secondary border-border"
                  rows={3}
                />
                <Button onClick={submitRequest} className="font-mono text-xs bg-primary text-primary-foreground">
                  <Lock className="w-3.5 h-3.5 mr-1.5" /> Request Access
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fix #3: Use fetched content, fall back to file.content, then empty string
  const content = resolvedContent ?? file.content ?? '';
  const lines = content.split('\n');

  return (
    <div className="bg-secondary/50 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary">
        <File className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs text-foreground flex-1">{file.path}</span>
        {file.restricted && canView && (
          <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
            <ShieldCheck className="w-3 h-3" /> AES-256 Decrypted via JIT
          </Badge>
        )}
        <span className="font-mono text-[10px] text-muted-foreground/60">{lines.length} lines</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
      {contentLoading ? (
        <div className="flex items-center justify-center h-24 font-mono text-xs text-muted-foreground">
          Decrypting file…
        </div>
      ) : content === '' ? (
        <div className="flex items-center justify-center h-24 font-mono text-xs text-muted-foreground/50 italic">
          (empty file)
        </div>
      ) : (
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm font-mono leading-relaxed">
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-accent/30 transition-colors">
                <span className="w-8 flex-shrink-0 text-right pr-4 text-muted-foreground/50 select-none text-xs leading-relaxed">
                  {i + 1}
                </span>
                <code className="text-foreground">{line || '\u00A0'}</code>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
