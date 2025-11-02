import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { renderMarkdown } from '../utils/formatters';


const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const isModel = message.role === 'model';

  if (isModel && message.text === '...') {
    return (
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <div className="bg-white dark:bg-slate-700/50 border border-stone-200 dark:border-slate-700 rounded-3xl rounded-tl-lg p-3 max-w-lg shadow-sm">
          <div className="flex space-x-1.5 animate-pulse">
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-start space-x-4 ${isModel ? '' : 'justify-end'}`}>
      {isModel && (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
          <SparklesIcon className="h-5 w-5" />
        </div>
      )}
      <div
        className={`px-4 py-3 rounded-3xl max-w-lg xl:max-w-xl prose prose-base dark:prose-invert prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-strong:font-semibold ${
          isModel
            ? 'bg-white dark:bg-slate-700/50 border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-lg'
            : 'bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-br-lg'
        }`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }}
      />
      {!isModel && (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-stone-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
          <UserIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;