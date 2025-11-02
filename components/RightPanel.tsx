import React from 'react';
import { ChatMessage } from '../types';
import ChatPanel from './ChatPanel';
import { XIcon } from './icons/XIcon';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  hasDocuments: boolean;
}

const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  hasDocuments,
}) => {
  return (
    <aside
      className={`fixed top-4 right-4 bottom-4 z-40 flex flex-col w-96 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-stone-200/80 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-stone-200/80 dark:border-slate-800/80">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Assistant</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Close Panel"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Panel */}
        <div className="flex-grow flex flex-col min-h-0">
          <ChatPanel
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            hasDocuments={hasDocuments}
          />
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;