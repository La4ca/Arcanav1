import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import RoleBadge from './RoleBadge';
import NotificationBell from './NotificationBell';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Shield, ScrollText, Sun, Moon, FileText } from 'lucide-react';
import arcanaLogo from '@/assets/logo/arcana.png';
import { Roles, hasRoleAtLeast, normalizeRole } from '@/utils/rbac';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();

  if (!currentUser) return null;
  const role = normalizeRole(currentUser.role);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(role === Roles.Admin ? [{ path: '/admin', label: 'Settings', icon: Shield }] : []),
    ...(hasRoleAtLeast(role, Roles.Triage) ? [{ path: '/logs', label: 'Logs', icon: ScrollText }] : []),
    { path: '/policy', label: 'Policy', icon: FileText },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full bg-card ring-1 ring-border/70 overflow-hidden flex items-center justify-center shadow-sm transition group-hover:ring-border">
                <img src={arcanaLogo} alt="Arcana" className="w-full h-full object-cover" draggable={false} />
              </div>
              <div className="hidden sm:block leading-none">
                <div className="font-serif font-semibold tracking-tight text-foreground">Arcana</div>
                <div className="mt-1 text-[11px] text-muted-foreground">mini GitHub</div>
              </div>
            </Link>

            <div className="flex items-center gap-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 rounded-full px-3 ${
                        active
                          ? 'bg-card text-foreground ring-1 ring-border/70 shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-card/70'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon"
              onClick={toggle}
              className="text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-full"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Notification Bell */}
            <NotificationBell />

            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border/60">
              <div className="w-9 h-9 rounded-full bg-card ring-1 ring-border/70 flex items-center justify-center text-xs font-semibold text-foreground">
                {currentUser.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-foreground leading-none">{currentUser.username}</p>
                <div className="mt-1"><RoleBadge role={currentUser.role} /></div>
              </div>
            </div>

            <Button
              variant="ghost" size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-red-500 hover:bg-card/70 rounded-full"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
