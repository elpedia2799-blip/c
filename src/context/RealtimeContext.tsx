import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ContactMessage } from '../types.ts';

interface ToastNotification {
  id: string;
  type: 'message' | 'project' | 'section' | 'info';
  title: string;
  description: string;
  timestamp: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  latestMessage: ContactMessage | null;
  subscribe: (eventType: string, handler: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({} as RealtimeContextType);

// Synthesize pleasant ambient notification chime via Web Audio API
function playChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2); // D6

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio might be muted or blocked by browser policy until interaction
  }
}

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [latestMessage, setLatestMessage] = useState<ContactMessage | null>(null);
  const [listeners] = useState<Map<string, Set<(payload: any) => void>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const subscribe = useCallback(
    (eventType: string, handler: (payload: any) => void) => {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, new Set());
      }
      listeners.get(eventType)!.add(handler);

      return () => {
        listeners.get(eventType)?.delete(handler);
      };
    },
    [listeners]
  );

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 4000);
      };

      // Listen for message.created
      eventSource.addEventListener('message.created', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const msg: ContactMessage = parsed.payload;
          setLatestMessage(msg);
          setUnreadCount((c) => c + 1);

          if (soundEnabled) playChime();

          const toastId = 'msg-' + Date.now();
          setToasts((prev) => [
            {
              id: toastId,
              type: 'message',
              title: `New Message from ${msg.name}`,
              description: `"${msg.subject}"`,
              timestamp: 'Just now',
            },
            ...prev.slice(0, 4),
          ]);

          // Notify any subscribers
          listeners.get('message.created')?.forEach((fn) => fn(msg));
        } catch (err) {
          console.error('Error handling message.created event:', err);
        }
      });

      // Listen for message.read
      eventSource.addEventListener('message.read', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.get('message.read')?.forEach((fn) => fn(parsed.payload));
        } catch (err) {}
      });

      // Listen for project events
      eventSource.addEventListener('project.created', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.get('project.created')?.forEach((fn) => fn(parsed.payload));
        } catch (err) {}
      });
      eventSource.addEventListener('project.updated', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.get('project.updated')?.forEach((fn) => fn(parsed.payload));
        } catch (err) {}
      });
      eventSource.addEventListener('project.deleted', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.get('project.deleted')?.forEach((fn) => fn(parsed.payload));
        } catch (err) {}
      });

      // Listen for section events
      eventSource.addEventListener('section.created', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.get('section.created')?.forEach((fn) => fn(parsed.payload));
        } catch (err) {}
      });
      eventSource.addEventListener('section.updated', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.get('section.updated')?.forEach((fn) => fn(parsed.payload));
        } catch (err) {}
      });
      eventSource.addEventListener('section.deleted', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.get('section.deleted')?.forEach((fn) => fn(parsed.payload));
        } catch (err) {}
      });
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [listeners, soundEnabled]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        unreadCount,
        setUnreadCount,
        toasts,
        removeToast,
        soundEnabled,
        setSoundEnabled,
        latestMessage,
        subscribe,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
