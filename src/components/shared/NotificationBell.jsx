import React, { useState, useRef, useEffect } from 'react';
import { Bell, GitFork, ShieldCheck, ShieldOff, ShieldAlert, UserPlus, Info } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_META = {
  repo_invite:     { icon: UserPlus,    color: 'text-blue-400',   dot: 'bg-blue-400' },
  access_request:  { icon: ShieldAlert, color: 'text-amber-400',  dot: 'bg-amber-400' },
  access_approved: { icon: ShieldCheck, color: 'text-emerald-400',dot: 'bg-emerald-400' },
  access_denied:   { icon: ShieldOff,   color: 'text-red-400',    dot: 'bg-red-400' },
  access_revoked:  { icon: ShieldOff,   color: 'text-red-400',    dot: 'bg-red-400' },
  commit:          { icon: GitFork,     color: 'text-primary',    dot: 'bg-primary' },
};
const DEFAULT_META = { icon: Info, color: 'text-muted-foreground', dot: 'bg-muted-foreground' };

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    // Mark all read when panel opens
    if (!open && unreadCount > 0) markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost" size="icon"
        className="relative text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-full"
        onClick={handleOpen}
      >
        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-[wiggle_0.4s_ease-in-out]' : ''}`} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-84 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ width: 320 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              {notifications.some(n => !n.read) && (
                <button onClick={markAllRead} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
                  Mark all read
                </button>
              )}
            </div>

            <ScrollArea className="max-h-96">
              {notifications.length === 0 ? (
                <div className="py-10 text-center font-mono text-xs text-muted-foreground">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-20" />
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 30).map(n => {
                  const meta = TYPE_META[n.type] || DEFAULT_META;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer transition-colors hover:bg-secondary/40 ${
                        !n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon with type color */}
                        <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                          <p className="font-mono text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {/* Unread dot */}
                        {!n.read && (
                          <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${meta.dot}`} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
