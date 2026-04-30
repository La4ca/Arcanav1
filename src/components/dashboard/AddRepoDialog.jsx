import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { showAutoToast } from '@/components/shared/AutoToast';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COL } from '@/lib/firestore';
import { Plus, Trash2, File, FolderPlus, Lock, Upload, PenLine } from 'lucide-react';

const DEFAULT_README = (name) => `# ${name}\n\nRepository created via Arcana.\n`;

export default function AddRepoDialog({ open, onClose }) {
  const { addRepo, addLog } = useData();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [files, setFiles] = useState([
    { path: 'README.md', content: '', restricted: false, inputMode: 'manual' },
  ]);
  const [loading, setLoading] = useState(false);
  // Which file index is currently the target for file-picker upload
  const [uploadTargetIdx, setUploadTargetIdx] = useState(null);

  const addFile = () => setFiles(prev => [...prev, { path: '', content: '', restricted: false, inputMode: 'manual' }]);
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));
  const updateFile = (i, key, val) => setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: val } : f));

  // Handle OS file picker — reads file content as text
  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    if (uploadTargetIdx !== null) {
      // Single-file mode: populate the target file slot
      const file = picked[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFiles(prev => prev.map((f, idx) =>
          idx === uploadTargetIdx
            ? { ...f, path: file.name, content: ev.target.result, inputMode: 'upload' }
            : f
        ));
      };
      reader.readAsText(file);
      setUploadTargetIdx(null);
    } else {
      // Bulk upload: append a new slot for each file
      picked.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setFiles(prev => [...prev, {
            path: file.name,
            content: ev.target.result,
            restricted: false,
            inputMode: 'upload',
          }]);
        };
        reader.readAsText(file);
      });
    }
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const triggerUploadForSlot = (idx) => {
    setUploadTargetIdx(idx);
    fileInputRef.current?.click();
  };

  const triggerBulkUpload = () => {
    setUploadTargetIdx(null);
    fileInputRef.current?.setAttribute('multiple', '');
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const repoName = name.trim().toLowerCase().replace(/\s+/g, '-');

      const repoRef = await addDoc(collection(db, COL.REPOS), {
        name: repoName,
        description: description.trim() || 'No description',
        owner: currentUser.id,
        is_sensitive: isSensitive,
        commits: 0,
        lastActivity: 'Just now',
      });
      const repoId = repoRef.id;

      const finalFiles = files
        .filter(f => f.path.trim())
        .map(f => ({
          ...f,
          content: f.content || (f.path === 'README.md' ? DEFAULT_README(repoName) : ''),
        }));

      for (const f of finalFiles) {
        await addDoc(collection(db, COL.FILES), {
          repoId,
          path: f.path.trim(),
          content: f.content,
          restricted: f.restricted,
          allowedRoles: f.restricted ? ['Admin', 'Maintainer'] : [],
        });
      }

      await addLog({
        user: currentUser.username,
        action: 'REPO_CREATED',
        repo: repoId,
        resource: repoName,
        ip: '127.0.0.1',
        meta: { files: finalFiles.length },
      });

      showAutoToast({ type: 'repo', title: 'Repository created', message: `${repoName} is ready with ${finalFiles.length} file(s)` });
      toast({ title: 'Repository created', description: `${repoName} has been added with ${finalFiles.length} file(s)` });

      setName(''); setDescription(''); setIsSensitive(false);
      setFiles([{ path: 'README.md', content: '', restricted: false, inputMode: 'manual' }]);
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Hidden file input shared by all upload triggers */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleFilePick}
      />

      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-foreground flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-primary" /> New Repository
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Repo info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">REPOSITORY NAME *</Label>
              <Input value={name} onChange={e => setName(e.target.value)}
                placeholder="my-repo-name" className="font-mono bg-secondary border-border" required />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">DESCRIPTION</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief description..." className="font-mono bg-secondary border-border" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div>
              <p className="font-mono text-xs text-foreground">Mark as Sensitive</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Restricts visibility and access</p>
            </div>
            <Switch checked={isSensitive} onCheckedChange={setIsSensitive} />
          </div>

          {/* Files section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">FILES</Label>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={triggerBulkUpload}
                  className="font-mono text-xs h-7 gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Files
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={addFile}
                  className="font-mono text-xs h-7 gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Manually
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {files.map((f, i) => (
                <div key={i} className={`rounded-lg border p-3 space-y-2 ${f.restricted ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-secondary/30'}`}>
                  {/* Row 1: path + controls */}
                  <div className="flex items-center gap-2">
                    {f.restricted
                      ? <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      : <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    }
                    <Input
                      value={f.path}
                      onChange={e => updateFile(i, 'path', e.target.value)}
                      placeholder="path/to/file.md"
                      className="font-mono text-xs bg-secondary border-border h-7 flex-1"
                    />

                    {/* Upload from disk for this slot */}
                    <Button type="button" variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                      title="Upload file from disk"
                      onClick={() => triggerUploadForSlot(i)}>
                      <Upload className="w-3.5 h-3.5" />
                    </Button>

                    {/* Trade secret toggle */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Lock className={`w-3 h-3 ${f.restricted ? 'text-amber-400' : 'text-muted-foreground/40'}`} />
                      <Switch
                        checked={f.restricted}
                        onCheckedChange={v => updateFile(i, 'restricted', v)}
                        className="scale-75"
                      />
                      <span className="font-mono text-[10px] text-muted-foreground">Secret</span>
                    </div>

                    {files.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(i)}
                        className="h-7 w-7 text-muted-foreground hover:text-red-400 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Upload mode indicator */}
                  {f.inputMode === 'upload' && f.content && (
                    <div className="flex items-center gap-1.5 px-1">
                      <Upload className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono text-[10px] text-emerald-400">
                        Uploaded · {f.content.split('\n').length} lines
                      </span>
                      <button type="button" onClick={() => updateFile(i, 'inputMode', 'manual')}
                        className="font-mono text-[10px] text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1">
                        <PenLine className="w-3 h-3" /> Edit manually
                      </button>
                    </div>
                  )}

                  {/* Content textarea (shown always in manual mode, hidden when uploaded) */}
                  {f.inputMode !== 'upload' && (
                    <Textarea
                      value={f.content}
                      onChange={e => updateFile(i, 'content', e.target.value)}
                      placeholder={`Content for ${f.path || 'this file'}… (optional)`}
                      className={`font-mono text-xs bg-secondary border-border min-h-[60px] resize-y ${f.restricted ? 'border-amber-500/40' : ''}`}
                    />
                  )}

                  {/* Trade secret badge */}
                  {f.restricted && (
                    <div className="flex items-center gap-1.5 px-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span className="font-mono text-[10px] text-amber-400">
                        Trade Secret — only Admin / Lead Dev can view
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="font-mono text-xs">Cancel</Button>
            <Button type="submit" disabled={!name.trim() || loading}
              className="font-mono text-xs bg-primary text-primary-foreground">
              {loading ? 'Creating…' : `Create Repository`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
