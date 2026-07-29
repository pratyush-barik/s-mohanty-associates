'use client';

import { useState, useRef, useEffect } from 'react';
import { sendProjectMessage, uploadProjectMessageAttachment } from '@/app/actions/service';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  employeeId: string | null;
  clientId: string | null;
  documents: { id: string; name: string; url: string; type: string; size: number }[];
}

interface Project {
  id: string;
  projectCode: string;
  source: string;
  serviceRequest: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    guestName: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
  } | null;
  pendingManagerId: string | null;
  assignedManagerId: string | null;
  status: string;
}

interface ProjectChatProps {
  projectId: string;
  project: Project;
  initialMessages: Message[];
  currentUserId: string;
  currentUserRole: string;
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

export default function ProjectChat({
  projectId,
  project,
  initialMessages,
  currentUserId,
  currentUserRole,
}: ProjectChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sourceLabel =
    project.source === 'GMAIL'
      ? '📧 Gmail'
      : project.source === 'EXTERNAL'
        ? '🔧 External'
        : '🌐 Website';
  const sourceColor =
    project.source === 'GMAIL'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : project.source === 'EXTERNAL'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-purple-100 text-purple-700 border-purple-200';

  const isEmailReply = project.source === 'GMAIL' || project.source === 'EXTERNAL';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndSend = async () => {
    if (!replyText.trim() && selectedFiles.length === 0) return;
    setIsSending(true);
    setAlert(null);

    try {
      const attachmentDocIds: string[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await uploadProjectMessageAttachment(projectId, formData);
        if (uploadResult.success && uploadResult.document) {
          attachmentDocIds.push(uploadResult.document.id);
        }
      }

      const result = await sendProjectMessage(projectId, replyText, attachmentDocIds);

      if (result.error) {
        setAlert({ type: 'error', text: result.error });
      } else {
        setAlert({ type: 'success', text: isEmailReply ? 'Message sent and email delivered.' : 'Message sent.' });
        setReplyText('');
        setSelectedFiles([]);
        setShowFiles(false);
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Failed to send message.' });
    }

    setIsSending(false);
    setUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUploadAndSend();
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        💬 Project Chat
      </h3>

      {alert && (
        <div className={`p-3 rounded-xl text-sm border font-medium mb-3 ${
          alert.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {alert.text}
        </div>
      )}

      {isEmailReply && (
        <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs mb-3">
          📧 This project is email-based. Replies will be sent via email to the client in addition to being saved here.
        </div>
      )}

      {project.pendingManagerId && (
        <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs mb-3">
          ⚠️ Oversight transfer in progress. Chat is available to both the current and incoming manager.
        </div>
      )}

      <div className="card overflow-hidden flex flex-col" style={{ height: '500px' }}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sourceColor}`}>
              {sourceLabel}
            </span>
            <span className="text-xs font-mono text-[#0f2038] font-bold">
              {project.projectCode}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isEmailReply && project.serviceRequest && (
              <span className="text-xs text-[#6c757d]">
                {project.serviceRequest.contactEmail || 'No email'}
              </span>
            )}
            {project.serviceRequest && (
              <span className="text-[10px] text-[#6c757d]">
                {project.serviceRequest.contactName || 'Client'}
              </span>
            )}
          </div>
        </div>

        {/* Files Section Toggle */}
        <div className="px-4 py-2 border-b border-[#e9ecef] bg-white">
          {messages.some(m => m.documents.length > 0) && (
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="text-xs font-medium text-[#b8860b] hover:text-[#0f2038] transition-colors"
            >
              {showFiles ? 'Hide' : 'Show'} Attachments ({messages.reduce((acc, m) => acc + m.documents.length, 0)})
            </button>
          )}
        </div>

        {/* Documents Area */}
        {showFiles && (
          <div className="px-4 py-3 border-b border-[#e9ecef] bg-white space-y-2">
            <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-2">All Case Attachments</p>
            {messages.flatMap(m => m.documents).map(doc => (
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
          {messages.length === 0 ? (
            <div className="text-center text-[#6c757d] text-sm py-8">
              No messages yet. Start the conversation below.
            </div>
          ) : (
            messages.map((msg) => {
              const isEmployee = msg.employeeId !== null;

              return (
                <div key={msg.id} className={`flex ${isEmployee ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 ${
                      isEmployee
                        ? 'bg-[#0f2038] text-white rounded-br-sm shadow-md'
                        : 'bg-white border border-[#e9ecef] text-[#343a40] rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        {isEmployee ? 'Employee' : 'Client'}
                      </span>
                      <span className="text-[10px]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.content && (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                    {msg.documents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.documents.map(doc => (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs text-white no-underline"
                          >
                            <span>{getFileIcon(doc.type)}</span>
                            <span className="flex-1 truncate">{doc.name}</span>
                            <span>{formatFileSize(doc.size)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Area */}
        <div className="p-4 border-t border-[#e9ecef] bg-white">
          {selectedFiles.length > 0 && (
            <div className="mb-2 space-y-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                  <span className="font-medium text-[#0f2038]">{file.name}</span>
                  <button
                    onClick={() => removeSelectedFile(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
              id={`chat-file-input-${projectId}`}
            />
            <label
              htmlFor={`chat-file-input-${projectId}`}
              className="px-3 py-2.5 border border-[#dee2e6] rounded-xl text-xs font-medium text-[#6c757d] hover:bg-[#f8f9fa] cursor-pointer transition-colors flex-shrink-0 bg-white"
            >
              🔗
            </label>
            <div className="flex-1 border border-[#dee2e6] rounded-xl bg-white focus-within:border-[#b8860b] focus-within:ring-2 focus-within:ring-[#b8860b]/20 transition-colors">
              <textarea
                className="w-full resize-none p-3 text-sm bg-transparent focus:outline-none rounded-xl"
                rows={2}
                placeholder={isEmailReply ? 'Type your reply (this will also be emailed to the client)...' : 'Type your reply...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                className="btn btn-primary px-5 h-10 text-sm"
                onClick={handleUploadAndSend}
                disabled={isSending || (!replyText.trim() && selectedFiles.length === 0)}
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}