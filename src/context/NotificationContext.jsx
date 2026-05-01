import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, currentUserId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUserId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(items); // ✅ ALWAYS SHOW
    });

    return unsub;
  }, [currentUserId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(
      unread.map(n =>
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      )
    );
  }, [notifications]);

  const markRead = useCallback(async (id) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        markRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}