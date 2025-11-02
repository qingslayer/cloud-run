import React from 'react';
import { UniversalSearchResult } from '../types';
import DocumentCard from './DocumentCard';
import { SparklesIcon } from './icons/SparklesIcon';
import { SearchIcon } from './icons/SearchIcon';
import { renderMarkdown } from '../utils/formatters';

interface SearchResultsPageProps {
  results: UniversalSearchResult | null;
  isLoading: boolean;
  onSelectDocument: (id: string) => void;
  onAskFollowUp: () => void;
  query: string;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  results,
  isLoading,
  onSelectDocument,
  onAskFollowUp,
  query
}) => {
  const isAnswerResult = results?.type === 'answer' && results.answer;
  const documentsToShow = results?.type === 'documents' ? results.documents : results?.sources;

  return (
    <div className="h-full pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-white">{query}</h1>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center text-center p-16">
            <SparklesIcon className="w-12 h-12 text-teal-500 animate-pulse" />
            <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">Thinking...</p>
            <p className="text-slate-500">The AI is analyzing your documents to find the best answer.</p>
          </div>
        ) : results ? (
          <div className="space-y-10">
            {/* AI Answer Section */}
            {isAnswerResult && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
                    <div 
                        className="prose prose-base dark:prose-invert prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-strong:font-semibold max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(results.answer!) }}
                    />
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    <span>Have more questions? </span>
                    <button onClick={onAskFollowUp} className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        Ask a follow-up
                    </button>
                </div>
              </div>
            )}

            {/* Document List / Sources Section */}
            {documentsToShow && documentsToShow.length > 0 ? (
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                        {isAnswerResult ? 'Sources from your records' : 'Relevant documents from your records'}
                    </h2>
                    <div className="space-y-3">
                        {documentsToShow.map(doc => (
                            <DocumentCard key={doc.id} document={doc} onView={onSelectDocument} onRemove={() => {}} />
                        ))}
                    </div>
                </div>
            ) : !isAnswerResult ? ( // Only show "No results" if it's not an answer page
                <div className="text-center py-20 border-2 border-dashed border-stone-300/70 dark:border-slate-800/70 rounded-3xl bg-white dark:bg-slate-900/50">
                    <SearchIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">No results found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search query.</p>
                </div>
            ) : null}
          </div>
        ) : (
           <div className="text-center py-20">
              <p className="text-slate-500 dark:text-slate-400">An unexpected error occurred.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;