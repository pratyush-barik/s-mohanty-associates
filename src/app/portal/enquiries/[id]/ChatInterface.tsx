'use client';

import { useState } from 'react';
import { replyToEnquiry, updateEnquiryStatus } from '@/app/actions/enquiry';

interface Message {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

interface ChatInterfaceProps {
  enquiryId: string;
  status: string;
  source: string;
  messages: Message[];
  documents: Document[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('application/pdf')) return '📄';
  if (mimeType.startsWith('text/')) return '📝';
  if (mimeType.startsWith('application/vnd.openxmlformats')) return '📊';
  if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-rar')) return '🗜️';
  return '📎';
}

export default function ChatInterface({
  enquiryId,
  status,
  source,
  messages: initialMessages,
  documents: initialDocuments,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);

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

  const sourceLabel = source === 'EMAIL' ? '📧 Email' : source === 'PORTAL_SIGNUP' ? '🌐 Portal Signup' : '🌐 Website';
  const sourceColor = source === 'EMAIL' ? 'bg-blue-100 text-blue-700 border-blue-200' : source === 'PORTAL_SIGNUP' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-purple-100 text-purple-700 border-purple-200';

  return (
    <div className="card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header with Source Badge */}
      <div className="px-4 py-3 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sourceColor}`}>
            {sourceLabel}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
            currentStatus === 'CLOSED' ? 'bg-gray-200 text-gray-600 border-gray-300' :
            currentStatus === 'NEW' ? 'bg-red-50 text-red-600 border-red-200' :
            currentStatus === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-200' :
            'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            {currentStatus.replace(/_/g, ' ')}
          </span>
        </div>
        {initialDocuments.length > 0 && (
          <button
            onClick={() => setShowFiles(!showFiles)}
            className="text-xs font-medium text-[#b8860b] hover:text-[#0f2038] transition-colors"
          >
            {showFiles ? 'Hide' : 'Show'} Files ({initialDocuments.length})
          </button>
        )}
      </div>

      {/* Files Section */}
      {showFiles && initialDocuments.length > 0 && (
        <div className="px-4 py-3 border-b border-[#e9ecef] bg-white space-y-2">
          <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-2">Case Files</p>
          {initialDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f8f9fa] transition-colors">
              <span className="text-lg">{getFileIcon(doc.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0f2038] truncate">{doc.name}</p>
                <p className="text-[10px] text-[#6c757d]">{formatFileSize(doc.size)}</p>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#b8860b] hover:bg-[#a07509] text-white text-xs font-medium rounded-lg transition-colors"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}

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
            <div key={msg.id} className={`flex gap-3 mb-2 ${isManager ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm border mt-1 ${
                isManager 
                  ? 'bg-gradient-to-br from-[#b8860b] to-[#c9952c] text-white border-[#b8860b]/20' 
                  : 'bg-white text-[#495057] border-[#dee2e6]'
              }`}>
                {isManager ? 'You' : 'CL'}
              </div>

              {/* Message Body */}
              <div className={`flex flex-col max-w-[75%] ${isManager ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1.5 px-1 ${isManager ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-[11px] font-semibold text-[#343a40]">
                    {isManager ? 'Staff Member' : 'Client'}
                  </span>
                  <span className="text-[10px] font-medium text-[#adb5bd]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`relative px-4 py-3 text-sm shadow-sm transition-all ${
                    isManager
                      ? 'bg-[#0f2038] text-white rounded-[20px] rounded-tr-[4px]'
                      : 'bg-white border border-[#e9ecef] text-[#343a40] rounded-[20px] rounded-tl-[4px]'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Area */}
      <div className="p-4 border-t border-[#e9ecef] bg-white">
        {currentStatus === 'CLOSED' ? (
          <div className="text-center p-4 bg-gray-50 text-gray-500 rounded-xl">
            This ticket is closed. New messages from the client will create a new case.
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