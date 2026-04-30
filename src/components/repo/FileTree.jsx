import React from 'react';
import { File, Folder, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

export default function FileTree({ repoId, selectedFile, onSelectFile }) {
  const { currentUser } = useAuth();
  const { files, canUserAccessFileJit } = useData();
  const repoFiles = files?.[repoId] || [];

  // Group files by directory
  const tree = {};
  repoFiles.forEach(f => {
    const parts = f.path.split('/');
    if (parts.length > 1) {
      const dir = parts[0];
      if (!tree[dir]) tree[dir] = [];
      tree[dir].push(f);
    } else {
      if (!tree['root']) tree['root'] = [];
      tree['root'].push(f);
    }
  });

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3 px-2">Files</p>
      {Object.entries(tree).map(([dir, dirFiles]) => (
        <div key={dir}>
          {dir !== 'root' && (
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-mono text-muted-foreground">
              <Folder className="w-3.5 h-3.5 text-primary/60" />
              <span>{dir}/</span>
            </div>
          )}
          {dirFiles.map(file => {
            const fileName = file.path.split('/').pop();
            const isSelected = selectedFile?.path === file.path;
            const canView = canUserAccessFileJit({ userId: currentUser.id, repoId, file });
            return (
              <button
                key={file.path}
                onClick={() => onSelectFile(file)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs font-mono rounded-md transition-colors ${
                  dir !== 'root' ? 'pl-6' : ''
                } ${isSelected
                  ? 'bg-primary/10 text-primary'
                  : canView
                    ? 'text-secondary-foreground hover:bg-accent'
                    : 'text-muted-foreground hover:bg-accent/60'
                }`}
              >
                {file.restricted && !canView ? (
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                ) : (
                  <File className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="truncate">{fileName}</span>
              </button>
            );
          })}
        </div>
      ))}
      {repoFiles.length === 0 && (
        <p className="text-xs font-mono text-muted-foreground px-2">No files available</p>
      )}
    </div>
  );
}