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
  // Determine if there's an AI-generated response to display
  const hasAIResponse =
    (results?.type === 'answer' && results.answer) ||
    (results?.type === 'summary' && results.summary) ||
    (results?.type === 'chat' && results.answer);

  // Get the AI response text
  const aiResponseText = results && hasAIResponse
    ? results.type === 'summary'
      ? results.summary
      : results.answer
    : null;

  // Get documents to display
  const documentsToShow = results
    ? results.type === 'documents'
      ? results.documents
      : 'referencedDocuments' in results
      ? results.referencedDocuments
      : []
    : [];

  // Determine the header for the documents section
  const documentsHeader = results?.type === 'documents'
    ? 'Relevant documents from your records'
    : hasAIResponse
    ? 'Sources from your records'
    : 'Documents';

  return (
    <div className="h-full pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-white">{query}</h1>
        </div>

        {/* AI Fallback Warning Banner */}
        {results?.fallback && (
          <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  AI Analysis Temporarily Unavailable
                </h3>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  {results.fallbackReason || 'The AI service is currently unavailable. Showing relevant documents from your records instead.'}
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  💡 Your documents are still being searched and ranked by relevance. Try your search again in a few moments for AI-powered answers.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center text-center p-16">
            <SparklesIcon className="w-12 h-12 text-teal-500 animate-pulse" />
            <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">Thinking...</p>
            <p className="text-slate-500">The AI is analyzing your documents to find the best answer.</p>
          </div>
        ) : results ? (
          <>
            {/* Google AI-Style Layout: AI response on left, sources on right (desktop only) */}
            {hasAIResponse && aiResponseText ? (
              <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
                {/* Left Column: AI Response */}
                <div className="flex-1 lg:max-w-2xl space-y-4 mb-8 lg:mb-0">
                  {/* Response Type Badge */}
                  {results.type === 'summary' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      <SparklesIcon className="w-3 h-3 mr-1" />
                      AI Summary
                    </div>
                  )}
                  {results.type === 'chat' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <SparklesIcon className="w-3 h-3 mr-1" />
                      Conversational Response
                    </div>
                  )}

                  {/* AI Response Card */}
                  <div className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-b border-stone-200 dark:border-slate-700">
                      <SparklesIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Overview</span>
                    </div>
                    <div className="p-6">
                      <div
                        className="prose prose-base dark:prose-invert prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-strong:font-semibold prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-slate-200 max-w-none text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(aiResponseText) }}
                      />
                    </div>
                  </div>

                  {/* Follow-up prompt */}
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    <span>Have more questions? </span>
                    <button onClick={onAskFollowUp} className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                      Ask a follow-up
                    </button>
                  </div>
                </div>

                {/* Right Column: Sources (compact cards on desktop, full cards on mobile) */}
                {documentsToShow && documentsToShow.length > 0 && (
                  <div className="lg:w-80 lg:flex-shrink-0">
                    <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wide">
                      Sources
                    </h2>
                    <div className="space-y-3">
                      {documentsToShow.map((doc, index) => (
                        <div
                          key={doc.id || `doc-${index}`}
                          onClick={() => onSelectDocument(doc.id)}
                          className="bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700/80 rounded-xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            {/* Document Icon/Thumbnail placeholder */}
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Document name */}
                              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                                {doc.displayName || doc.filename}
                              </h3>

                              {/* Category badge */}
                              {doc.category && (
                                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                                  {doc.category}
                                </span>
                              )}

                              {/* Date */}
                              {doc.uploadDate && (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                                  {new Date(doc.uploadDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No AI response: Show documents in traditional vertical layout */
              <div>
                {documentsToShow && documentsToShow.length > 0 ? (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                      {documentsHeader}
                    </h2>
                    <div className="space-y-3">
                      {documentsToShow.map((doc, index) => (
                        <DocumentCard key={doc.id || `doc-${index}`} document={doc} onView={onSelectDocument} onRemove={() => {}} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-stone-300/70 dark:border-slate-800/70 rounded-3xl bg-white dark:bg-slate-900/50">
                    <SearchIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">No results found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search query.</p>
                  </div>
                )}
              </div>
            )}
          </>
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
