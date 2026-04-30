import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { showAutoToast } from '@/components/shared/AutoToast';
import { GitCommitHorizontal } from 'lucide-react';

export default function CommitForm({ repoId }) {
  const { currentUser } = useAuth();
  const { addCommit, addLog } = useData();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [filesChanged, setFilesChanged] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      const fileList = filesChanged.split(',').map(f => f.trim()).filter(Boolean);
      await addCommit(repoId, {
        commitId: Math.random().toString(16).slice(2, 8),
        message: message.trim(),
        author: currentUser.username,
        timestamp: new Date().toISOString(),
        files: fileList,
      });
      await addLog({
        user: currentUser.username,
        action: 'COMMIT',
        repo: repoId,
        resource: 'commit',
        ip: '127.0.0.1',
        meta: { message: message.trim(), files: fileList },
      });
      showAutoToast({ type: 'success', title: 'Commit pushed', message: message.trim() });
      setMessage('');
      setFilesChanged('');
    } catch (err) {
      showAutoToast({ type: 'danger', title: 'Commit failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <GitCommitHorizontal className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-sm font-semibold text-foreground">New Commit</h3>
      </div>
      <div className="space-y-2">
        <Label className="font-mono text-xs text-muted-foreground">COMMIT MESSAGE *</Label>
        <Input value={message} onChange={e => setMessage(e.target.value)}
          placeholder="feat: add new feature" required
          className="font-mono text-xs bg-secondary border-border" />
      </div>
      <div className="space-y-2">
        <Label className="font-mono text-xs text-muted-foreground">FILES CHANGED (comma-separated)</Label>
        <Textarea value={filesChanged} onChange={e => setFilesChanged(e.target.value)}
          placeholder="src/App.jsx, README.md"
          className="font-mono text-xs bg-secondary border-border min-h-[60px]" />
      </div>
      <Button type="submit" disabled={!message.trim() || loading}
        className="font-mono text-xs bg-primary text-primary-foreground">
        {loading ? 'Pushing…' : 'Push Commit'}
      </Button>
    </form>
  );
}
