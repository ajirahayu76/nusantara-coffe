import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationItem } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  toasts: Toast[];
  removeToast: (id: string) => void;
  showToast: (type: Toast['type'], title: string, message: string) => void;
  lastEvent: { type: string; data: any; timestamp: number } | null;
  unreadNotificationsCount: number;
  notifications: NotificationItem[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType>({} as RealtimeContextType);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any; timestamp: number } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showToast = (type: Toast['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch<NotificationItem[]>('/notifications');
      setNotifications(data);
    } catch (e) {
      // ignore
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/realtime/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          reconnectTimeout = setTimeout(connectSSE, 4000);
        };

        eventSource.addEventListener('CONNECTED', () => {
          setIsConnected(true);
        });

        eventSource.addEventListener('TRANSACTION_CREATED', (e: MessageEvent) => {
          const payload = JSON.parse(e.data);
          setLastEvent({ type: 'TRANSACTION_CREATED', data: payload, timestamp: Date.now() });
          showToast(
            'success',
            'Transaksi Berhasil!',
            `Faktur ${payload.sale.invoiceNumber} senilai Rp ${Number(payload.sale.totalAmount).toLocaleString('id-ID')} tersimpan.`
          );
          fetchNotifications();
        });

        eventSource.addEventListener('TRANSACTION_CANCELLED', (e: MessageEvent) => {
          const payload = JSON.parse(e.data);
          setLastEvent({ type: 'TRANSACTION_CANCELLED', data: payload, timestamp: Date.now() });
          showToast(
            'warning',
            'Transaksi Dibatalkan',
            `Faktur ${payload.invoiceNumber} dibatalkan & stok dikembalikan ke gudang.`
          );
          fetchNotifications();
        });

        eventSource.addEventListener('STOCK_UPDATED', (e: MessageEvent) => {
          const payload = JSON.parse(e.data);
          setLastEvent({ type: 'STOCK_UPDATED', data: payload, timestamp: Date.now() });
          fetchNotifications();
        });

        eventSource.addEventListener('PAYMENT_STATUS_CHANGED', (e: MessageEvent) => {
          const payload = JSON.parse(e.data);
          setLastEvent({ type: 'PAYMENT_STATUS_CHANGED', data: payload, timestamp: Date.now() });
          if (payload.status === 'SUCCESS') {
            showToast('success', 'Pembayaran QRIS Berhasil!', `Pembayaran senilai Rp ${Number(payload.amount).toLocaleString('id-ID')} terverifikasi gateway.`);
          }
        });

        eventSource.addEventListener('PRODUCT_CREATED', (e: MessageEvent) => {
          const payload = JSON.parse(e.data);
          setLastEvent({ type: 'PRODUCT_CREATED', data: payload, timestamp: Date.now() });
          fetchNotifications();
        });

        eventSource.addEventListener('SETTINGS_UPDATED', (e: MessageEvent) => {
          const payload = JSON.parse(e.data);
          setLastEvent({ type: 'SETTINGS_UPDATED', data: payload, timestamp: Date.now() });
        });
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 4000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        toasts,
        removeToast,
        showToast,
        lastEvent,
        unreadNotificationsCount,
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 transform transition-all duration-300 animate-slide-up ${
              toast.type === 'success'
                ? 'bg-amber-950 text-amber-50 border-amber-600/40'
                : toast.type === 'warning'
                ? 'bg-orange-950 text-orange-50 border-orange-600/40'
                : toast.type === 'error'
                ? 'bg-red-950 text-red-50 border-red-600/40'
                : 'bg-stone-900 text-stone-100 border-stone-700'
            }`}
          >
            <div className="flex-1">
              <h5 className="font-semibold text-sm tracking-wide text-amber-400">{toast.title}</h5>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
