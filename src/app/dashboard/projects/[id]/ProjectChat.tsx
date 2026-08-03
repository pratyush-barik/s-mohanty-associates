'use client';

import { useState, useRef, useEffect } from 'react';
import { sendProjectMessage, uploadProjectMessageAttachment } from '@/app/actions/service';

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
  documents: { id: string; name: string; url: string; type: string; size: number }[];
}

interface ProjectChatProps {
  projectId: string;
  messages: Message[];
  currentUserId: string;
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
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.startsWith('video/')) return '🎬';
  return '🔗';
}

export default function ProjectChat({ projectId, messages: initialMessages, currentUserId }: ProjectChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending) return;
    setSending(true);
    setError(null);

    try {
      const attachmentDocIds: string[] = [];
      const newDocs: any[] = [];

      // Upload files first
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await uploadProjectMessageAttachment(projectId, formData);
        
        if (uploadResult.error) {
          setError(uploadResult.error);
          setSending(false);
          return;
        }

        if (uploadResult.success && uploadResult.document) {
          attachmentDocIds.push(uploadResult.document.id);
          newDocs.push(uploadResult.document);
        }
      }

      const result = await sendProjectMessage(projectId, newMessage, attachmentDocIds);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
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
            documents: newDocs,
          },
        ]);
        setNewMessage('');
        setSelectedFiles([]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message due to an unexpected error.');
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
                      {msg.content && (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                      
                      {/* Attachments within bubble */}
                      {msg.documents && msg.documents.length > 0 && (
                        <div className={`mt-3 space-y-2 pt-3 border-t ${isOwn ? 'border-white/10' : 'border-[#e9ecef]'}`}>
                          {msg.documents.map(doc => (
                            <a
                              key={doc.id}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all no-underline ${
                                isOwn 
                                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                  : 'bg-[#f8f9fa] border-[#e9ecef] hover:bg-[#f1f3f5] text-[#495057]'
                              }`}
                            >
                              <span className="text-xl">{getFileIcon(doc.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold truncate leading-tight">{doc.name}</p>
                                <p className={`text-[9px] mt-0.5 ${isOwn ? 'text-white/60' : 'text-[#868e96]'}`}>
                                  {formatFileSize(doc.size)}
                                </p>
                              </div>
                              <div className={`p-1.5 rounded-lg ${isOwn ? 'bg-white/10' : 'bg-white border shadow-sm'}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex flex-col pt-4 border-t border-[#e9ecef]">
        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 space-y-1">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                <span className="font-medium text-[#0f2038]">{file.name}</span>
                <button
                  onClick={() => removeSelectedFile(idx)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="shrink-0 cursor-pointer p-2.5 text-[#6c757d] hover:text-[#0f2038] hover:bg-gray-100 rounded-xl transition-colors">
            <input type="file" multiple className="hidden" onChange={handleFileChange} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </label>
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
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
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
    </div>
  );
}
