'use client';

import { useState, useRef, useEffect } from 'react';
import { sendProjectMessage } from '@/app/actions/service';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
    profilePhoto: string | null;
  };
}

interface ProjectChatProps {
  projectId: string;
  messages: Message[];
  currentUserId: string;
}

export default function ProjectChat({ projectId, messages: initialMessages, currentUserId }: ProjectChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    const result = await sendProjectMessage(projectId, newMessage);

    if (result.success) {
      // Optimistically add the message
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          content: newMessage,
          createdAt: new Date().toISOString(),
          sender: {
            id: currentUserId,
            name: 'You',
            role: 'CLIENT',
            profilePhoto: null,
          },
        },
      ]);
      setNewMessage('');
    }

    setSending(false);
  };

  const roleLabels: Record<string, string> = {
    CLIENT: 'Client',
    OWNER: 'Owner',
    MANAGER: 'Manager',
    FIELD_EMPLOYEE: 'Field Inspector',
    REPORT_EMPLOYEE: 'Report Analyst',
  };

  return (
    <div className="card p-6 flex flex-col h-[600px]">
      <h2 className="text-sm font-semibold text-[#0f2038] uppercase tracking-wider mb-4">
        Communication
      </h2>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-3xl mb-3">💬</div>
              <p className="text-sm text-[#adb5bd]">No messages yet.</p>
              <p className="text-xs text-[#dee2e6] mt-1">
                Start a conversation about your project.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === currentUserId;
              return (
                <div key={msg.id} className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm border mt-1 overflow-hidden ${
                    isOwn 
                      ? 'bg-gradient-to-br from-[#b8860b] to-[#c9952c] text-white border-[#b8860b]/20' 
                      : 'bg-[#f8f9fa] text-[#495057] border-[#dee2e6]'
                  }`}>
                    {msg.sender.profilePhoto ? (
                      <img src={msg.sender.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      isOwn ? 'You' : msg.sender.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Message Body */}
                  <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1.5 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[11px] font-semibold text-[#343a40]">
                        {isOwn ? 'You' : msg.sender.name}
                      </span>
                      <span className="text-[10px] font-medium text-[#adb5bd]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`relative px-4 py-3 text-sm shadow-sm transition-all ${
                        isOwn
                          ? 'bg-gradient-to-br from-[#b8860b] to-[#c9952c] text-white rounded-[20px] rounded-tr-[4px]'
                          : 'bg-white border border-[#e9ecef] text-[#0f2038] rounded-[20px] rounded-tl-[4px]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-3 pt-4 border-t border-[#e9ecef]">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#dee2e6] bg-white text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="btn btn-primary px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
