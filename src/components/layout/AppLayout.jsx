import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Navbar from '@/components/shared/Navbar';
import NdaModal from '@/components/shared/NdaModal';
import { AutoToastContainer } from '@/components/shared/AutoToast';
import { Loader2 } from 'lucide-react';

export default function AppLayout() {
  const { currentUser, authLoading, ndaAccepted, acceptNda } = useAuth();
  const { loading: dataLoading } = useData();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-mono text-xs text-muted-foreground">Connecting to Arcana…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;

  return (
    <NotificationProvider currentUserId={currentUser.id}>
      <div className="min-h-screen">
        <NdaModal open={!ndaAccepted} onAccept={acceptNda} />
        <Navbar />
        {dataLoading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="font-mono text-xs text-muted-foreground">Loading data…</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <main className="rounded-2xl bg-background/85 backdrop-blur-xl ring-1 ring-border/60 shadow-[0_30px_80px_-40px_rgba(28,32,33,0.55)]">
              <div className="p-5 sm:p-7">
                <Outlet />
              </div>
            </main>
          </div>
        )}
        {/* Auto-dismiss popup toasts */}
        <AutoToastContainer />
      </div>
    </NotificationProvider>
  );
}
