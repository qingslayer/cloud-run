import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ChatPanelProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  hasDocuments: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, hasDocuments }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-100 dark:bg-slate-800/50">
      <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
             <div className="p-4 bg-teal-500/10 rounded-full mb-4">
                <SparklesIcon className="w-10 h-10 text-teal-500" />
             </div>
             <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">AI Assistant</h2>
             <p className="mt-1 max-w-md text-slate-500 dark:text-slate-400">
               {hasDocuments 
                 ? "Ask me anything about your records."
                 : "Upload a document to begin."}
            </p>
           </div>
        ) : (
          messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
        {isLoading && <ChatMessage message={{ id: 'loading', role: 'model', text: '...' }} />}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 bg-white/70 dark:bg-slate-900/50 p-4 border-t border-stone-200 dark:border-slate-700/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={!hasDocuments ? "Please upload a document first" : "Ask about your documents..."}
            disabled={isLoading || !hasDocuments}
            className="w-full pl-5 pr-14 py-3 rounded-full bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/80 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !hasDocuments}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:opacity-90 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-100"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;