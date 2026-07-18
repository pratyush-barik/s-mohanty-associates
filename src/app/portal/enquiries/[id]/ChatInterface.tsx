'use client';

import { useState } from 'react';
import { replyToEnquiry, updateEnquiryStatus } from '@/app/actions/enquiry';

interface Message {
  id: string;
  sender: string; // 'CLIENT' | 'MANAGER' | 'SYSTEM'
  body: string;
  createdAt: string;
}

export default function ChatInterface({
  enquiryId,
  status,
  messages: initialMessages,
}: {
  enquiryId: string;
  status: string;
  messages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);

    // Optimistic update
    const optimisticMsg: Message = {
      id: Math.random().toString(),
      sender: 'MANAGER',
      body: replyText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyText('');

    const res = await replyToEnquiry(enquiryId, optimisticMsg.body);
    if (res.success) {
      setCurrentStatus('WAITING_FOR_CLIENT');
    } else {
      // Revert if error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert(res.error || 'Failed to send reply');
    }
    setIsSending(false);
  };

  const handleClose = async () => {
    const res = await updateEnquiryStatus(enquiryId, 'CLOSED');
    if (res.success) {
      setCurrentStatus('CLOSED');
    }
  };

  return (
    <div className="card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fa]">
        {messages.map((msg) => {
          const isManager = msg.sender === 'MANAGER';
          const isSystem = msg.sender === 'SYSTEM';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                  {msg.body}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isManager ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl p-4 ${
                  isManager
                    ? 'bg-[#0f2038] text-white rounded-br-sm shadow-md'
                    : 'bg-white border border-[#e9ecef] text-[#343a40] rounded-bl-sm shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {isManager ? 'You' : 'Client'}
                  </span>
                  <span className="text-[10px]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Area */}
      <div className="p-4 border-t border-[#e9ecef] bg-white">
        {currentStatus === 'CLOSED' ? (
          <div className="text-center p-4 bg-gray-50 text-gray-500 rounded-xl">
            This ticket is closed.
          </div>
        ) : (
          <div className="flex gap-3">
            <textarea
              className="input-field flex-1 resize-none"
              rows={3}
              placeholder="Type your reply here... (This will be emailed to the client)"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-primary px-6 h-12"
                onClick={handleReply}
                disabled={isSending || !replyText.trim()}
              >
                {isSending ? 'Sending...' : 'Send Reply'}
              </button>
              <button
                className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                onClick={handleClose}
              >
                Close Ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
