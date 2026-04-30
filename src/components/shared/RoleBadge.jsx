import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield, Wrench, Pencil, ClipboardList, Eye } from "lucide-react";
import { Roles, normalizeRole } from "@/utils/rbac";

const roleConfig = {
  [Roles.Admin]: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Shield, label: "Admin" },
  [Roles.Maintainer]: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Wrench, label: "Maintainer" },
  [Roles.Write]: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Pencil, label: "Write" },
  [Roles.Triage]: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: ClipboardList, label: "Triage" },
  [Roles.Read]: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Eye, label: "View" },
};

export default function RoleBadge({ role, size = "sm" }) {
  const config = roleConfig[normalizeRole(role)] || roleConfig[Roles.Read];
  const Icon = config.icon;
  const isLarge = size === "lg";

  return (
    <Badge variant="outline" className={`${config.color} border font-mono ${isLarge ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}>
      <Icon className={`${isLarge ? 'w-4 h-4' : 'w-3 h-3'} mr-1`} />
      {config.label}
    </Badge>
  );
}