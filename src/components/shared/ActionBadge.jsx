import React from 'react';
import { Badge } from "@/components/ui/badge";

const actionConfig = {
  VIEW_FILE: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  COMMIT: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  ACCESS_DENIED: { color: "bg-red-500/20 text-red-400 border-red-500/30" },
  REQUEST_ACCESS: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  APPROVE_ACCESS: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  DENY_ACCESS: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  LOGIN: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  EXPORT_LOG: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

export default function ActionBadge({ action }) {
  const config = actionConfig[action] || actionConfig.VIEW_FILE;
  return (
    <Badge variant="outline" className={`${config.color} border font-mono text-xs px-2 py-0.5`}>
      {action}
    </Badge>
  );
}