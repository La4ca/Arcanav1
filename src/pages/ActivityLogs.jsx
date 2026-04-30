import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import ActionBadge from '@/components/shared/ActionBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Filter, Search, RefreshCw } from 'lucide-react';
import Unauthorized from '@/components/shared/Unauthorized';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Roles, hasRoleAtLeast, normalizeRole } from '@/utils/rbac';

function MetaCell({ meta }) {
  if (!meta || Object.keys(meta).length === 0) return <span className="text-muted-foreground/40">—</span>;
  const parts = [];
  if (meta.path) parts.push(<span key="path" className="text-blue-400/80">{meta.path}</span>);
  if (meta.reason) parts.push(<span key="reason" className="text-amber-400/80">{meta.reason}</span>);
  if (meta.role) parts.push(<span key="role" className="text-purple-400/80">role:{meta.role}</span>);
  if (meta.restricted) parts.push(<span key="res" className="text-red-400/70">restricted</span>);
  if (meta.requestId) parts.push(<span key="req" className="text-muted-foreground/60">req:{meta.requestId.slice(0,8)}</span>);
  return (
    <div className="flex flex-wrap gap-1.5">
      {parts.map((p, i) => (
        <span key={i} className="font-mono text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded border border-border/50">
          {p}
        </span>
      ))}
    </div>
  );
}

export default function ActivityLogs() {
  const { currentUser } = useAuth();
  const { logs } = useData();
  const { toast } = useToast();

  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [search, setSearch] = useState('');

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueUsers = [...new Set(logs.map(l => l.user))];

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const actionMatch = actionFilter === 'all' || log.action === actionFilter;
      const userMatch = userFilter === 'all' || log.user === userFilter;
      const searchMatch = !search || [log.user, log.action, log.repo, log.resource, log.ip]
        .some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()));
      return actionMatch && userMatch && searchMatch;
    });
  }, [logs, actionFilter, userFilter, search]);

  if (!hasRoleAtLeast(normalizeRole(currentUser.role), Roles.Triage)) return <Unauthorized />;

  const exportCSV = () => {
    const headers = ['ID,User,Action,Repository,Resource,IP,Timestamp,Meta'];
    const rows = filteredLogs.map(l =>
      `${l.id},${l.user},${l.action},${l.repo},${l.resource},${l.ip},${l.timestamp},"${JSON.stringify(l.meta || {}).replace(/"/g, '""')}"`
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: "CSV file downloaded successfully" });
  };

  const alertCount = logs.filter(l => l.action === 'ACCESS_DENIED').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold text-foreground">Activity Logs</h1>
          <p className="text-sm font-mono text-muted-foreground mt-1">
            System-wide audit trail &mdash; <span className="text-red-400">{alertCount} access denied</span> event{alertCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="font-mono text-xs border-border">
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="pl-8 w-44 font-mono text-xs bg-secondary border-border h-8"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48 font-mono text-xs bg-secondary border-border h-8">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-mono text-xs">All Actions</SelectItem>
            {uniqueActions.map(a => (
              <SelectItem key={a} value={a} className="font-mono text-xs">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-48 font-mono text-xs bg-secondary border-border h-8">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-mono text-xs">All Users</SelectItem>
            {uniqueUsers.map(u => (
              <SelectItem key={u} value={u} className="font-mono text-xs">{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(actionFilter !== 'all' || userFilter !== 'all' || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="font-mono text-xs text-muted-foreground h-8"
            onClick={() => { setActionFilter('all'); setUserFilter('all'); setSearch(''); }}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 border-border">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Timestamp</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">User</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Action</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Repository</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Resource</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">IP Address</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map(log => (
              <TableRow
                key={log.id}
                className={[
                  "border-border",
                  log.action === 'ACCESS_DENIED' ? 'bg-red-500/5 hover:bg-red-500/10' : ''
                ].join(' ')}
              >
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{log.timestamp}</TableCell>
                <TableCell className="font-mono text-xs text-foreground">{log.user}</TableCell>
                <TableCell><ActionBadge action={log.action} /></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.repo}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.resource}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                <TableCell><MetaCell meta={log.meta} /></TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center font-mono text-xs text-muted-foreground py-8">
                  No logs match the current filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-[10px] font-mono text-muted-foreground text-right">
        Showing {filteredLogs.length} of {logs.length} entries
      </p>
    </motion.div>
  );
}
