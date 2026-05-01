import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Code, History, GitCommitHorizontal, Settings, Upload } from 'lucide-react';
import FileTree from '@/components/repo/FileTree';
import CodeViewer from '@/components/repo/CodeViewer';
import CommitHistory from '@/components/repo/CommitHistory';
import CommitForm from '@/components/repo/CommitForm';
import UploadFileForm from '@/components/repo/UploadFileForm';
import RepoSidebar from '@/components/repo/RepoSidebar';
import RepoSettingsTab from '@/components/repo/RepoSettingsTab';
import Unauthorized from '@/components/shared/Unauthorized';
import { motion } from 'framer-motion';
import { Roles, hasRoleAtLeast, normalizeRole } from '@/utils/rbac';

export default function RepoView() {
  const { id: repoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { repos, repoAccess } = useData();

  const repo = repos.find(r => r.id === repoId);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!repo) {
    return (
      <div className="text-center py-20">
        <p className="font-mono text-muted-foreground">Repository not found</p>
      </div>
    );
  }

  const hasRepoAccess =
    normalizeRole(currentUser.role) === Roles.Admin ||
    repo.owner === currentUser.id ||
    repoAccess.some(a => a.userId === currentUser.id && a.repoId === repo.id);

  if (!hasRepoAccess) return <Unauthorized />;

  const isWritePlus = hasRoleAtLeast(normalizeRole(currentUser.role), Roles.Write);

  // Read ?tab= from URL — defaults to 'code'
  const defaultTab = searchParams.get('tab') || 'code';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost" size="icon"
          onClick={() => navigate('/dashboard')}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-mono font-bold text-foreground">{repo.name}</h1>
          <p className="text-xs font-mono text-muted-foreground">{repo.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Tree */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-3">
          <FileTree repoId={repoId} selectedFile={selectedFile} onSelectFile={setSelectedFile} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-7">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="bg-secondary border border-border mb-4">
              <TabsTrigger value="code" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
                <Code className="w-3.5 h-3.5" /> Code
              </TabsTrigger>
              <TabsTrigger value="history" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
                <History className="w-3.5 h-3.5" /> History
              </TabsTrigger>
              {isWritePlus && (
                <TabsTrigger value="commit" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
                  <GitCommitHorizontal className="w-3.5 h-3.5" /> Commit
                </TabsTrigger>
              )}
              {isWritePlus && (
                <TabsTrigger value="upload" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </TabsTrigger>
              )}
              <TabsTrigger value="settings" className="font-mono text-xs gap-1.5 data-[state=active]:bg-accent">
                <Settings className="w-3.5 h-3.5" /> Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code">
              {!selectedFile ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground border border-dashed border-border rounded-lg">
                  <Code className="w-8 h-8 opacity-30" />
                  <p className="font-mono text-sm">Select a file from the tree to view its contents</p>
                </div>
              ) : (
                <CodeViewer file={selectedFile} repoId={repoId} />
              )}
            </TabsContent>

            <TabsContent value="history">
              <CommitHistory repoId={repoId} />
            </TabsContent>

            {isWritePlus && (
              <TabsContent value="commit">
                <CommitForm repoId={repoId} />
              </TabsContent>
            )}

            {isWritePlus && (
              <TabsContent value="upload">
                <UploadFileForm repoId={repoId} />
              </TabsContent>
            )}

            <TabsContent value="settings">
              <RepoSettingsTab repoId={repoId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Repo Info Sidebar */}
        <div className="lg:col-span-3 bg-card rounded-lg border border-border p-4">
          <RepoSidebar repo={repo} />
        </div>
      </div>
    </motion.div>
  );
}
