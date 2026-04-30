import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { ThemeProvider } from '@/lib/ThemeContext';

import AuthGate from '@/pages/AuthGate';
import Dashboard from '@/pages/Dashboard';
import RepoView from '@/pages/RepoView';
import AdminPanel from '@/pages/AdminPanel';
import ActivityLogs from '@/pages/ActivityLogs';
import SecurityPolicy from '@/pages/SecurityPolicy';
import FirebaseSetup from '@/pages/FirebaseSetup';
import AppLayout from '@/components/layout/AppLayout';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider>
          <DataProvider>
            <Router>
              <Routes>
                <Route path="/" element={<AuthGate />} />
                <Route path="/setup" element={<FirebaseSetup />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/repo/:id" element={<RepoView />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/logs" element={<ActivityLogs />} />
                  <Route path="/policy" element={<SecurityPolicy />} />
                </Route>
                <Route path="*" element={<PageNotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </DataProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
