import React, { useState, useEffect } from 'react';
import { Mail, X, Search, CheckCircle, Clock, Trash2, ExternalLink, Shield, Send } from 'lucide-react';
import { ContactMessage } from '../types.ts';
import { fetchAdminMessages, updateAdminMessageStatus, deleteAdminMessage } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';

interface MessagesModalProps {
  onClose: () => void;
  onOpenAdminLogin: () => void;
}

interface LocalSentMessage {
  id: number | string;
  name: string;
  email: string;
  subject: string;
  message: string;
  sentAt?: string;
  createdAt?: string;
  status: string;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({ onClose, onOpenAdminLogin }) => {
  const { isAuthenticated } = useAuth();
  const { subscribe } = useRealtime();

  const [activeTab, setActiveTab] = useState<'admin_inbox' | 'sent_history'>(
    isAuthenticated ? 'admin_inbox' : 'sent_history'
  );
  const [adminMessages, setAdminMessages] = useState<ContactMessage[]>([]);
  const [localSent, setLocalSent] = useState<LocalSentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);

  // Load local sent messages from localStorage
  const loadLocalSent = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('lord_zicco_sent_messages') || '[]');
      setLocalSent(saved);
      if (saved.length > 0 && !selectedMsg) {
        setSelectedMsg(saved[0]);
      }
    } catch (e) {
      setLocalSent([]);
    }
  };

  // Load admin messages from database
  const loadAdminMessages = async () => {
    if (!isAuthenticated) {
      setActiveTab('sent_history');
      return;
    }
    setIsLoading(true);
    try {
      const list = await fetchAdminMessages();
      setAdminMessages(list);
      if (list.length > 0 && !selectedMsg) {
        setSelectedMsg(list[0]);
      }
    } catch (err: any) {
      // If unauthorized, gracefully switch to sent_history tab
      setActiveTab('sent_history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocalSent();
    if (isAuthenticated) {
      loadAdminMessages();
    } else {
      setActiveTab('sent_history');
    }
  }, [isAuthenticated]);

  // Real-time updates for messages
  useEffect(() => {
    const unsub = subscribe('message.created', (newMsg: ContactMessage) => {
      setAdminMessages((prev) => [newMsg, ...prev]);
    });
    return () => unsub();
  }, [subscribe]);

  const handleMarkStatus = async (id: number, status: 'unread' | 'read' | 'archived') => {
    try {
      await updateAdminMessageStatus(id, status);
      await loadAdminMessages();
      if (selectedMsg && selectedMsg.id === id) {
        setSelectedMsg({ ...selectedMsg, status });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAdminMsg = async (id: number) => {
    if (!confirm('Permanently delete this message?')) return;
    try {
      await deleteAdminMessage(id);
      setAdminMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClearLocalSent = () => {
    if (!confirm('Clear your local sent messages history?')) return;
    localStorage.removeItem('lord_zicco_sent_messages');
    setLocalSent([]);
    setSelectedMsg(null);
  };

  const displayedList =
    activeTab === 'admin_inbox'
      ? adminMessages.filter(
          (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.subject.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : localSent.filter(
          (m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 lg:p-10 flex justify-center items-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#24304A] bg-[#070B17] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0D1326] border-b border-[#24304A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4D8DFF]/20 border border-[#4D8DFF]/40 flex items-center justify-center text-[#4D8DFF]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#F8FAFC]">
                Transmission Center & Messages
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                View sent inquiries and incoming real-time communications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#111A30] border border-[#24304A] text-[#94A3B8] hover:text-white hover:border-[#4D8DFF] transition-colors"
              aria-label="Close message view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="p-4 bg-[#070B17] border-b border-[#24304A] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0D1326] border border-[#24304A]">
            <button
              onClick={() => {
                setActiveTab('sent_history');
                setSelectedMsg(localSent[0] || null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'sent_history'
                  ? 'bg-[#4D8DFF] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>My Sent Messages ({localSent.length})</span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  setActiveTab('admin_inbox');
                  setSelectedMsg(adminMessages[0] || null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'admin_inbox'
                    ? 'bg-[#4D8DFF] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Inbox ({adminMessages.length})</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#4D8DFF] hover:bg-[#111A30] flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Sign In</span>
              </button>
            )}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, subject..."
              className="w-full pl-8 pr-4 py-1.5 rounded-lg bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
            />
          </div>
        </div>

        {/* Master Details Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
          {/* Messages List (Left 5 Cols) */}
          <div className="md:col-span-5 border-r border-[#24304A] overflow-y-auto divide-y divide-[#24304A]/60 bg-[#0D1326]/50">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#94A3B8]">
                Loading messages...
              </div>
            ) : displayedList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8] space-y-2">
                <p>No messages in this view.</p>
                {activeTab === 'sent_history' && (
                  <p className="text-[11px] text-[#94A3B8]/60">
                    Submit the contact form on the website to see your sent transmission log here!
                  </p>
                )}
              </div>
            ) : (
              displayedList.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMsg(msg)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    selectedMsg?.id === msg.id
                      ? 'bg-[#111A30] border-l-2 border-[#4D8DFF]'
                      : 'hover:bg-[#111A30]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-[#F8FAFC] truncate">
                      {msg.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8] shrink-0">
                      {'createdAt' in msg && msg.createdAt
                        ? new Date(msg.createdAt).toLocaleDateString()
                        : 'sentAt' in msg && msg.sentAt
                        ? new Date(msg.sentAt).toLocaleDateString()
                        : 'Recently'}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-[#4D8DFF] truncate mt-0.5">
                    {msg.subject}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] line-clamp-1 mt-0.5">
                    {msg.message}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-[#94A3B8]/70 truncate">{msg.email}</span>
                    <span className="font-mono text-[#22D3EE] uppercase">
                      {msg.status || 'Delivered'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Reader (Right 7 Cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-[#070B17] flex flex-col justify-between">
            {selectedMsg ? (
              <div className="space-y-5">
                <div className="border-b border-[#24304A] pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#22D3EE] uppercase tracking-wider block">
                      {activeTab === 'sent_history' ? 'SENT INQUIRY RECEIPT' : 'INCOMING TRANSMISSION'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4D8DFF]/20 text-[#4D8DFF] font-semibold uppercase">
                      {selectedMsg.status || 'Delivered'}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#F8FAFC] mt-1">
                    {selectedMsg.subject}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8] mt-2">
                    <span>
                      From: <strong className="text-[#F8FAFC]">{selectedMsg.name}</strong> ({selectedMsg.email})
                    </span>
                    <span>·</span>
                    <span className="font-mono">
                      {selectedMsg.createdAt
                        ? new Date(selectedMsg.createdAt).toLocaleString()
                        : new Date(selectedMsg.sentAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-[#94A3B8] uppercase block mb-1">
                    Message Body
                  </span>
                  <div className="p-4 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs sm:text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-line">
                    {selectedMsg.message}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#24304A] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {activeTab === 'admin_inbox' && isAuthenticated && (
                      <>
                        <button
                          onClick={() =>
                            handleMarkStatus(
                              selectedMsg.id,
                              selectedMsg.status === 'unread' ? 'read' : 'unread'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg border border-[#24304A] bg-[#111A30] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC]"
                        >
                          Mark {selectedMsg.status === 'unread' ? 'Read' : 'Unread'}
                        </button>
                        <button
                          onClick={() => handleDeleteAdminMsg(selectedMsg.id)}
                          className="p-1.5 rounded-lg border border-[#24304A] hover:border-red-500 text-[#94A3B8] hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {activeTab === 'sent_history' && (
                      <button
                        onClick={handleClearLocalSent}
                        className="text-xs text-[#94A3B8] hover:text-red-400 transition-colors"
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  <a
                    href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(
                      selectedMsg.subject
                    )}`}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] text-white text-xs font-semibold flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-[#94A3B8]">
                Select a message to view transmission details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
