import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { showAutoToast } from '@/components/shared/AutoToast';
import { Upload, FileUp, X } from 'lucide-react';

export default function UploadFileForm({ repoId }) {
  const { currentUser } = useAuth();
  const { addFile, addLog } = useData();

  const [selectedFile, setSelectedFile] = useState(null);   // the File object
  const [customPath, setCustomPath]     = useState('');      // optional path override
  const [restricted, setRestricted]     = useState(false);   // trade-secret toggle
  const [loading, setLoading]           = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    // Pre-fill path with the file's name if user hasn't typed one
    if (!customPath) setCustomPath(f.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    if (!customPath) setCustomPath(f.name);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setCustomPath('');
    setRestricted(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile || !customPath.trim()) return;
    setLoading(true);
    try {
      // Read file content as text
      const content = await selectedFile.text();
      const path = customPath.trim();

      await addFile(repoId, { path, content, restricted });
      await addLog({
        user: currentUser.username,
        action: 'FILE_UPLOAD',
        repo: repoId,
        resource: path,
        ip: '127.0.0.1',
        meta: { restricted },
      });

      showAutoToast({
        type: 'success',
        title: 'File uploaded',
        message: `${path} added to repository`,
      });
      clearFile();
    } catch (err) {
      showAutoToast({ type: 'danger', title: 'Upload failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-card rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <FileUp className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-sm font-semibold text-foreground">Upload File</h3>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-3 h-36 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
      >
        {selectedFile ? (
          <div className="flex items-center gap-2 font-mono text-sm text-foreground">
            <Upload className="w-4 h-4 text-primary" />
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground opacity-40" />
            <p className="font-mono text-xs text-muted-foreground">
              Drop a file here or <span className="text-primary underline">browse</span>
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* File path */}
      <div className="space-y-1.5">
        <Label className="font-mono text-xs text-muted-foreground">FILE PATH IN REPO</Label>
        <Input
          value={customPath}
          onChange={(e) => setCustomPath(e.target.value)}
          placeholder="e.g. src/utils/helper.js or README.md"
          className="font-mono text-xs bg-secondary border-border"
        />
        <p className="font-mono text-[10px] text-muted-foreground opacity-60">
          Use folders like <span className="text-primary">src/file.js</span> to organize files
        </p>
      </div>

      {/* Restricted toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
        <div>
          <p className="font-mono text-xs font-semibold text-foreground">Mark as Trade Secret</p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Restricted — requires JIT approval to view
          </p>
        </div>
        <Switch checked={restricted} onCheckedChange={setRestricted} />
      </div>

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || !customPath.trim() || loading}
        className="font-mono text-xs bg-primary text-primary-foreground w-full"
      >
        {loading ? 'Uploading…' : 'Upload File'}
      </Button>
    </div>
  );
}
