"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiTrash2, FiCpu, FiPaperclip, FiX } from "react-icons/fi";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  hasImage?: boolean;
  hasFile?: boolean;
  imageUrl?: string;
}

interface ChatBoxProps {
  messages: Message[];
  onSend: (text: string, fileData?: string, fileMimeType?: string) => void;
  isLoading: boolean;
  onClear: () => void;
}

export default function ChatBox({ messages, onSend, isLoading, onClear }: ChatBoxProps) {
  const [input, setInput]     = useState("");
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, type: string} | null>(null);
  
  const endRef                = useRef<HTMLDivElement>(null);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);
  const fileInputRef          = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !attachedFile) || isLoading) return;
    
    // Pass text and the attached file if present
    onSend(text, attachedFile?.data, attachedFile?.type);
    
    setInput("");
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as base64 data url
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        // split off the data prefix 'data:image/jpeg;base64,' to just get raw b64
        const parts = result.split(",");
        setAttachedFile({
          name: file.name,
          data: parts.length === 2 ? parts[1] : result,
          type: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
    
    // clear input value so the same file could be selected again
    e.target.value = '';
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="glass rounded-xl flex flex-col overflow-hidden"
      style={{
        border: "1px solid rgba(0,212,255,0.12)",
        height: "100%",
        minHeight: "400px",
      }}
    >
      {/* Chat header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: "1px solid rgba(0,212,255,0.08)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div className="flex items-center gap-2">
          <FiCpu className="text-sm" style={{ color: "var(--neon-blue)" }} />
          <span
            className="text-xs font-display uppercase tracking-widest"
            style={{ color: "var(--neon-blue)" }}
          >
            AI Conversation
          </span>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-mono"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "var(--text-muted)",
            }}
          >
            Gemini 1.5 Pro
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {messages.length} messages
          </span>
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClear}
              className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: "var(--neon-red)" }}
              title="Clear conversation"
            >
              <FiTrash2 className="text-sm" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
        style={{ maxHeight: "380px" }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-40">
            <FiCpu className="text-3xl" style={{ color: "var(--neon-blue)" }} />
            <p className="text-xs font-mono text-center" style={{ color: "var(--text-muted)" }}>
              Start a conversation, or capture a camera frame
              <br />
              to analyze it with Gemini AI.
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 ${
                      msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                    }`}
                  >
                    {/* Role label */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[9px] font-display uppercase tracking-widest"
                        style={{
                          color:
                            msg.role === "user"
                              ? "var(--neon-blue)"
                              : "var(--neon-cyan)",
                        }}
                      >
                        {msg.role === "user" ? "You" : "RescueLens AI"}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.hasImage && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(0,212,255,0.1)",
                            color: "var(--neon-blue)",
                            border: "1px solid rgba(0,212,255,0.2)",
                          }}
                        >
                          📷 +Image
                        </span>
                      )}
                      {msg.hasFile && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            color: "var(--text-secondary)",
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}
                        >
                          📎 +File
                        </span>
                      )}
                    </div>

                    {/* Image preview */}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Attached"
                        className="w-full rounded-lg mb-2"
                        style={{ maxHeight: "140px", objectFit: "cover" }}
                      />
                    )}

                    {/* Content */}
                    <p
                      className="text-sm font-mono leading-relaxed whitespace-pre-wrap"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="chat-bubble-ai px-4 py-3 rounded-xl flex items-center gap-1.5"
                  >
                    <span
                      className="text-[9px] font-display uppercase tracking-widest mr-2"
                      style={{ color: "var(--neon-cyan)" }}
                    >
                      Thinking
                    </span>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="typing-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={endRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid rgba(0,212,255,0.08)", background: "rgba(0,0,0,0.2)" }}
      >
        <AnimatePresence>
          {attachedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="mb-2 flex items-center gap-2"
            >
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  color: "var(--neon-blue)",
                }}
              >
                <FiPaperclip />
                <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                <button 
                  onClick={() => setAttachedFile(null)}
                  className="ml-1 hover:text-white transition-colors"
                >
                  <FiX />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(0,212,255,0.15)",
            transition: "all 0.3s ease",
          }}
        >
          {/* Hidden file input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.txt,.doc,.docx"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm font-mono py-1"
            style={{
              color: "var(--text-primary)",
              caretColor: "var(--neon-blue)",
              lineHeight: "1.5",
            }}
          />

          {/* Attachment button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mb-0.5 transition-all duration-200"
            style={{
              color: "var(--text-muted)",
              background: "rgba(255,255,255,0.02)",
            }}
            title="Attach a file or image"
          >
            <FiPaperclip className="text-sm hover:text-white transition-colors" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile) || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mb-0.5 transition-all duration-200"
            style={{
              background:
                (input.trim() || attachedFile) && !isLoading
                  ? "rgba(0,212,255,0.2)"
                  : "rgba(255,255,255,0.04)",
              border:
                (input.trim() || attachedFile) && !isLoading
                  ? "1px solid rgba(0,212,255,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
              color:
                (input.trim() || attachedFile) && !isLoading
                  ? "var(--neon-blue)"
                  : "var(--text-muted)",
              boxShadow:
                (input.trim() || attachedFile) && !isLoading ? "0 0 10px rgba(0,212,255,0.2)" : "none",
            }}
          >
            <FiSend className="text-sm" />
          </motion.button>
        </div>
        <p
          className="text-[9px] font-mono mt-1.5 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Powered by Gemini 1.5 Pro · Context memory enabled
        </p>
      </div>
    </div>
  );
}
