import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './config/firebase';
import { DocumentFile, ChatMessage as ChatMessageType, DocumentCategory, Theme, View, UniversalSearchResult, getDocumentProcessingStatus } from './types';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Login from './components/Login';
import DocumentDetailView from './components/DocumentDetailView';
import ToastContainer from './components/ToastContainer';
import ConfirmationModal from './components/ConfirmationModal';
import LoadingState from './components/LoadingState';
import GlobalUploadButton from './components/GlobalUploadButton';
import RightPanel from './components/RightPanel';
import Settings from './components/Settings';
import TopCommandBar from './components/TopCommandBar';
import SearchResultsPage from './components/SearchResultsPage';
import ReviewModal from './components/ReviewModal';
import { sendChatMessage } from './services/chatService';
import { processUniversalSearch } from './services/searchService';
import { getDocuments, uploadDocument, updateDocument as apiUpdateDocument, deleteDocument as apiDeleteDocument, getDocument } from './services/documentProcessor';
import { useToast } from './hooks/useToast';
import { useOnboarding } from './hooks/useOnboarding';
import WelcomeModal from './components/WelcomeModal';
import OnboardingTooltip from './components/OnboardingTooltip';
import { TIMEOUTS, STORAGE_KEYS } from './config/constants';
import { MESSAGES } from './config/messages';

const App: React.FC = () => {
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentData, setSelectedDocumentData] = useState<DocumentFile | null>(null);
  const [selectedDocumentEditMode, setSelectedDocumentEditMode] = useState(false);
  const isLoadingDocumentRef = useRef(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as Theme) || 'system');
  const [recordsFilter, setRecordsFilter] = useState<DocumentCategory | 'all'>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [viewedDocuments, setViewedDocuments] = useState<Set<string>>(() => {
    // Load viewed documents from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.VIEWED_DOCS);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // State for integrated search flow
  const [pageSearchResults, setPageSearchResults] = useState<UniversalSearchResult | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  // State for confirmation modals
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    documentId?: string;
    type: 'single' | 'all';
    isDeleting: boolean;
  }>({ isOpen: false, type: 'single', isDeleting: false });

  // State for review modal
  const [reviewModalDocument, setReviewModalDocument] = useState<DocumentFile | null>(null);

  // Onboarding state
  const { state: onboardingState, markComplete, dismissTooltip, shouldShowTooltip, resetOnboarding } = useOnboarding();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const uploadButtonRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setIsDocumentsLoading(true);
        getDocuments().then(({ documents: fetchedDocuments }) => {
          setDocuments(fetchedDocuments);
          setIsDocumentsLoading(false);
        }).catch((err) => {
          console.error("Error loading documents:", err);
          error(MESSAGES.ERRORS.LOAD_DOCUMENTS);
          setIsDocumentsLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Show welcome modal for first-time users (only after initial document fetch completes)
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);

  useEffect(() => {
    // Mark initial fetch as complete only when:
    // 1. We have a user
    // 2. Loading is complete
    // 3. We haven't already marked it complete
    if (currentUser && !isDocumentsLoading && !initialFetchComplete) {
      // Small delay to ensure documents state has fully updated
      const timer = setTimeout(() => {
        setInitialFetchComplete(true);
      }, TIMEOUTS.INITIAL_FETCH);
      return () => clearTimeout(timer);
    }
  }, [currentUser, isDocumentsLoading, initialFetchComplete]);

  useEffect(() => {
    // Only show welcome modal after initial fetch is truly complete
    if (initialFetchComplete && currentUser && !onboardingState.hasSeenWelcome && documents.length === 0) {
      setShowWelcomeModal(true);
    }
  }, [initialFetchComplete, currentUser, onboardingState.hasSeenWelcome, documents.length]);

  // Poll for updates on documents that are still processing
  useEffect(() => {
    if (!currentUser) return;

    const pollForUpdates = async () => {
      try {
        const { documents: freshDocs } = await getDocuments();

        setDocuments(prevDocs => {
          // Check if there are any processing documents
          const hasProcessing = prevDocs.some(doc => !doc.aiAnalysis);

          // If no processing documents, don't update
          if (!hasProcessing) return prevDocs;

          // Update documents that have changed
          let hasChanges = false;
          const updatedDocs = prevDocs.map(doc => {
            const fresh = freshDocs.find(f => f.id === doc.id);
            if (fresh && !doc.aiAnalysis && fresh.aiAnalysis) {
              hasChanges = true;
            }
            return fresh || doc;
          });

          // Only update state if something actually changed
          return hasChanges ? updatedDocs : prevDocs;
        });
      } catch (err) {
        console.error('Error polling for document updates:', err);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollForUpdates, TIMEOUTS.POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [currentUser]); // Only depend on currentUser, not documents


  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      root.classList.toggle('dark', isDark);
    };

    applyTheme();
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', applyTheme);
        return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key - Close modals, panels, and detail views
      if (e.key === 'Escape') {
        if (isRightPanelOpen) {
          setIsRightPanelOpen(false);
        } else if (selectedDocumentId) {
          handleCloseDocumentDetail();
        }
        return;
      }

      // Cmd/Ctrl + K - Focus search bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Cmd/Ctrl + U - Open upload (if not already focused in an input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const uploadButton = document.querySelector('[aria-label="Upload documents"]') as HTMLButtonElement;
          if (uploadButton) {
            uploadButton.click();
          }
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRightPanelOpen, selectedDocumentId]);

  const handleNavigateToRecords = (category: DocumentCategory) => {
    setRecordsFilter(category);
    setView('records');
  };

  const handleSetView = (newView: View) => {
    // Close document detail view when switching views
    if (selectedDocumentId) {
      handleCloseDocumentDetail();
    }
    setView(newView);
  };

  const handleDeleteAllRecords = () => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'all',
      isDeleting: false
    });
  };

  const confirmDeleteAll = async () => {
    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      await Promise.all(documents.map(doc => apiDeleteDocument(doc.id)));
      setDocuments([]);
      success(MESSAGES.SUCCESS.ALL_DELETED);
      setDeleteConfirmation({ isOpen: false, type: 'all', isDeleting: false });
    } catch (err) {
      console.error("Error deleting all records:", err);
      error(MESSAGES.ERRORS.DELETE_DOCUMENT);
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleFilesChange = (newFiles: DocumentFile[]) => {
    setDocuments(prevDocs => [...newFiles, ...prevDocs]);

    // Mark onboarding milestone
    if (!onboardingState.hasUploadedFirstDocument && newFiles.length > 0) {
      markComplete('hasUploadedFirstDocument');
    }
  };

  const handleUpdateDocument = useCallback(async (id: string, updates: Partial<DocumentFile>) => {
    try {
      const { id: _, ...safeUpdates } = updates as any;

      const updatedDoc = await apiUpdateDocument(id, safeUpdates);

      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === id ? updatedDoc : doc))
      );

      if (selectedDocumentId === id) {
        setSelectedDocumentData(updatedDoc);
      }

    } catch (err) {
      console.error("Error updating document:", err);
      error(MESSAGES.ERRORS.UPDATE_DOCUMENT);
    }
  }, [selectedDocumentId, error]);

  const handleApproveReview = useCallback(async (updates: Partial<DocumentFile>) => {
    if (!reviewModalDocument) return;

    try {
      const { id: _, ...safeUpdates } = updates as any;

      const updatedDoc = await apiUpdateDocument(reviewModalDocument.id, safeUpdates);

      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === reviewModalDocument.id ? updatedDoc : doc))
      );

      setReviewModalDocument(null); // Close review modal

      // Mark onboarding milestone ONLY when approved (reviewedAt is set)
      if (!onboardingState.hasReviewedFirstDocument && updates.reviewedAt) {
        markComplete('hasReviewedFirstDocument');
      }

    } catch (err) {
      console.error("Error approving document:", err);
      error(MESSAGES.ERRORS.SAVE_REVIEWED);
      throw err; // Re-throw so ReviewModal can handle it
    }
  }, [reviewModalDocument, error, onboardingState.hasReviewedFirstDocument, markComplete]);

  const handleReviewLater = useCallback(async (updates: Partial<DocumentFile>) => {
    if (!reviewModalDocument) return;

    try {
      const { id: _, ...safeUpdates } = updates as any;

      const updatedDoc = await apiUpdateDocument(reviewModalDocument.id, safeUpdates);

      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === reviewModalDocument.id ? updatedDoc : doc))
      );

      setReviewModalDocument(null); // Close review modal
      // Do NOT mark as reviewed - document stays in pending_review state

    } catch (err) {
      console.error("Error saving review changes:", err);
      error(MESSAGES.ERRORS.SAVE_CHANGES);
      throw err; // Re-throw so ReviewModal can handle it
    }
  }, [reviewModalDocument, error]);

  const handleRequestDeleteDocument = useCallback((id: string) => {
    setDeleteConfirmation({
      isOpen: true,
      documentId: id,
      type: 'single',
      isDeleting: false
    });
  }, []);

  const confirmDeleteDocument = async () => {
    const { documentId } = deleteConfirmation;
    if (!documentId) return;

    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      await apiDeleteDocument(documentId);
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

      if (selectedDocumentId === documentId) {
        handleCloseDocumentDetail();
      }

      success(MESSAGES.SUCCESS.DOCUMENT_DELETED);
      setDeleteConfirmation({ isOpen: false, type: 'single', isDeleting: false });
    } catch (err) {
      console.error("Error deleting document:", err);
      error(MESSAGES.ERRORS.DELETE_DOCUMENT);
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleRemoveMultipleDocuments = (ids: string[]) => {
    ids.forEach(id => handleRequestDeleteDocument(id));
  };

  const selectedDocumentIdRef = useRef<string | null>(null);
  const selectedDocumentDataRef = useRef<DocumentFile | null>(null);
  const lastSelectedDocumentIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedDocumentIdRef.current = selectedDocumentId;
  }, [selectedDocumentId]);

  useEffect(() => {
    selectedDocumentDataRef.current = selectedDocumentData;
  }, [selectedDocumentData]);

  const handleSelectDocument = useCallback(async (id: string, editMode: boolean = false) => {
    if (isLoadingDocumentRef.current) {
      return;
    }

    const isCurrentlyDisplayed =
      (selectedDocumentIdRef.current === id) &&
      selectedDocumentDataRef.current?.id === id;

    if (isCurrentlyDisplayed && !editMode) {
      return;
    }

    isLoadingDocumentRef.current = true;
    lastSelectedDocumentIdRef.current = id;

    try {
      const fullDoc = await getDocument(id);

      // Check if document needs review
      const status = getDocumentProcessingStatus(fullDoc);

      if (status === 'pending_review' && !editMode) {
        // Open review modal instead of detail view (unless explicitly requesting edit mode)
        setReviewModalDocument(fullDoc);
      } else {
        // Open normal detail view for reviewed documents
        selectedDocumentDataRef.current = fullDoc;
        setSelectedDocumentData(fullDoc);

        selectedDocumentIdRef.current = id;
        setSelectedDocumentId(id);
        setSelectedDocumentEditMode(editMode);

        setViewedDocuments(prev => {
          const newSet = new Set(prev);
          newSet.add(id);
          localStorage.setItem(STORAGE_KEYS.VIEWED_DOCS, JSON.stringify(Array.from(newSet)));
          return newSet;
        });
      }

    } catch (err) {
      console.error("Error fetching document details:", err);
      error(MESSAGES.ERRORS.LOAD_DOCUMENT);
      selectedDocumentDataRef.current = null;
      lastSelectedDocumentIdRef.current = null;
    } finally {
      isLoadingDocumentRef.current = false;
    }
  }, [error]);

  const handleCloseDocumentDetail = () => {
    selectedDocumentIdRef.current = null;
    selectedDocumentDataRef.current = null;
    lastSelectedDocumentIdRef.current = null;
    isLoadingDocumentRef.current = false;
    setSelectedDocumentId(null);
    setSelectedDocumentData(null);
    setSelectedDocumentEditMode(false);
  };

  // Get current document navigation context (memoized for performance)
  const navigationContext = useMemo(() => {
    // Get currently visible documents based on view and filter
    let visibleDocs = documents.filter(doc => doc.status === 'complete');

    if (view === 'records' && recordsFilter !== 'all') {
      visibleDocs = visibleDocs.filter(doc => doc.category === recordsFilter);
    }

    // Sort by date desc (same as Records view default)
    visibleDocs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    const currentIndex = selectedDocumentId ? visibleDocs.findIndex(doc => doc.id === selectedDocumentId) : -1;

    return {
      allDocuments: visibleDocs,
      currentIndex,
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < visibleDocs.length - 1
    };
  }, [documents, view, recordsFilter, selectedDocumentId]);

  const handleNavigateDocument = useCallback((direction: 'prev' | 'next') => {
    const { allDocuments, currentIndex } = navigationContext;

    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < allDocuments.length - 1) {
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex && allDocuments[newIndex]) {
      handleSelectDocument(allDocuments[newIndex].id);
    }
  }, [navigationContext, handleSelectDocument]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessageType = { id: Date.now().toString(), role: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await sendChatMessage(message, chatMessages, chatSessionId || undefined);

      setChatSessionId(result.sessionId);

      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.answer
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error in chat:', err);
      error('Failed to send message. Please try again.');
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chatMessages, chatSessionId, error]);

  const handleSearchSubmit = async (query: string) => {
    if (!query.trim()) return;

    // Close any open document detail view
    handleCloseDocumentDetail();

    setChatMessages([]);
    setChatSessionId(null);

    setSearchQuery(query);
    setIsSearchLoading(true);
    setPageSearchResults(null);
    setView('search');

    // Mark onboarding milestone
    if (!onboardingState.hasUsedSearch) {
      markComplete('hasUsedSearch');
    }

    try {
      const searchResult = await processUniversalSearch(query);
      setPageSearchResults(searchResult);

      if (searchResult.type === 'chat') {
        setChatSessionId(searchResult.sessionId);
      }
    } catch (err) {
      console.error("Search failed:", err);
      error(MESSAGES.ERRORS.SEARCH_FAILED);
      setPageSearchResults({
        type: 'answer',
        answer: 'Sorry, an error occurred during the search.',
        referencedDocuments: []
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleAskFollowUp = () => {
    if (!pageSearchResults) return;

    const isValidForFollowUp =
      (pageSearchResults.type === 'answer' && pageSearchResults.answer) ||
      (pageSearchResults.type === 'summary' && pageSearchResults.summary) ||
      (pageSearchResults.type === 'chat' && pageSearchResults.answer);

    if (!isValidForFollowUp) return;

    const responseText = pageSearchResults.type === 'summary'
      ? pageSearchResults.summary
      : pageSearchResults.answer;

    const initialHistory: ChatMessageType[] = [
      { id: 'followup-0', role: 'user', text: searchQuery },
      { id: 'followup-1', role: 'model', text: responseText },
    ];

    setChatMessages(initialHistory);

    if (pageSearchResults.type === 'chat') {
      setChatSessionId(pageSearchResults.sessionId);
    }

    setView('dashboard');
    setIsRightPanelOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDocuments([]);
      setChatMessages([]);
      setView('dashboard');
      setIsRightPanelOpen(false);
      setSelectedDocumentId(null);
    } catch (err) {
      console.error('Error signing out:', err);
      error(MESSAGES.ERRORS.SIGN_OUT_FAILED);
    }
  };

  const selectedDocument = selectedDocumentId ? selectedDocumentData : null;

  // Show loading state during initial auth check
  if (isAuthLoading) {
    return <LoadingState message={MESSAGES.LOADING.DEFAULT} fullScreen />;
  }

  // Show loading state during initial document fetch (prevents flash of empty state)
  if (currentUser && isDocumentsLoading && !initialFetchComplete) {
    return <LoadingState message={MESSAGES.LOADING.HEALTH_RECORDS} fullScreen />;
  }

  if (!currentUser) {
    return <Login />;
  }

  const renderMainContent = () => {
    switch(view) {
        case 'dashboard':
            return <Dashboard documents={documents} onNavigateToRecords={handleNavigateToRecords} onSelectDocument={handleSelectDocument} isLoading={isDocumentsLoading} />;
        case 'records':
            return <Records
                        initialFilter={recordsFilter}
                        documents={documents}
                        onFilesChange={handleFilesChange}
                        onUpdateDocument={handleUpdateDocument}
                        onRemoveDocument={handleRequestDeleteDocument}
                        onRemoveMultipleDocuments={handleRemoveMultipleDocuments}
                        onSelectDocument={handleSelectDocument}
                        onError={error}
                        viewedDocuments={viewedDocuments}
                   />;
        case 'settings':
            return <Settings theme={theme} setTheme={setTheme} onDeleteAllRecords={handleDeleteAllRecords} currentUser={currentUser} onResetOnboarding={resetOnboarding} />;
        case 'search':
            return <SearchResultsPage
                        results={pageSearchResults}
                        isLoading={isSearchLoading}
                        onSelectDocument={handleSelectDocument}
                        onAskFollowUp={handleAskFollowUp}
                        query={searchQuery}
                        onSearch={handleSearchSubmit}
                   />;
    }
  }

  return (
     <div className="font-sans h-screen flex flex-col bg-white dark:bg-[#0B1120]">
        <TopCommandBar
          activeView={view}
          setView={handleSetView}
          onSearch={handleSearchSubmit}
          onLogout={handleLogout}
          theme={theme}
          setTheme={setTheme}
          toggleRightPanel={() => setIsRightPanelOpen(prev => !prev)}
          currentUser={currentUser}
          uploadButton={
            <GlobalUploadButton
              onFilesChange={handleFilesChange}
              onUpdateDocument={handleUpdateDocument}
              onError={error}
              documents={documents}
              onSelectDocument={handleSelectDocument}
            />
          }
          onBack={selectedDocumentId ? handleCloseDocumentDetail : undefined}
          navigationContext={selectedDocumentId ? {
            currentIndex: navigationContext.currentIndex,
            total: navigationContext.allDocuments.length,
            hasPrev: navigationContext.hasPrev,
            hasNext: navigationContext.hasNext
          } : undefined}
          onNavigate={selectedDocumentId ? handleNavigateDocument : undefined}
        />

        <main className={`flex-1 overflow-y-auto bg-stone-50 dark:bg-[#0B1120] transition-all duration-300 ${isRightPanelOpen ? 'pr-[25rem]' : ''}`}>
          {selectedDocument ? (
            <DocumentDetailView
              documentData={selectedDocument}
              onClose={handleCloseDocumentDetail}
              onUpdate={handleUpdateDocument}
              onDelete={handleRequestDeleteDocument}
              navigationContext={navigationContext}
              onNavigate={handleNavigateDocument}
              initialEditMode={selectedDocumentEditMode}
            />
          ) : (
            renderMainContent()
          )}
        </main>

        <RightPanel
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          hasDocuments={documents.length > 0}
        />

        {reviewModalDocument && (
          <ReviewModal
            document={reviewModalDocument}
            onApprove={handleApproveReview}
            onReviewLater={handleReviewLater}
            onClose={() => setReviewModalDocument(null)}
          />
        )}

       <ConfirmationModal
         isOpen={deleteConfirmation.isOpen}
         onClose={() => setDeleteConfirmation({ isOpen: false, type: 'single', isDeleting: false })}
         onConfirm={deleteConfirmation.type === 'all' ? confirmDeleteAll : confirmDeleteDocument}
         title={deleteConfirmation.type === 'all' ? 'Delete All Records?' : 'Delete Document?'}
         message={
           deleteConfirmation.type === 'all'
             ? 'This will permanently delete ALL your health records from the system. This action cannot be undone and your data cannot be recovered. Are you absolutely sure?'
             : 'This will permanently delete this document from the system. This action cannot be undone and the file cannot be recovered. Are you sure you want to continue?'
         }
         confirmText={deleteConfirmation.type === 'all' ? 'Delete All Forever' : 'Delete Forever'}
         variant="danger"
         isLoading={deleteConfirmation.isDeleting}
       />

       <ToastContainer toasts={toasts} onClose={removeToast} />

       {/* Welcome Modal */}
       {showWelcomeModal && (
         <WelcomeModal
           onClose={() => {
             setShowWelcomeModal(false);
             markComplete('hasSeenWelcome');
           }}
         />
       )}

       {/* Onboarding Tooltips - only show after user has documents */}
       {reviewModalDocument && !onboardingState.hasReviewedFirstDocument && shouldShowTooltip('review-document') && (
         <div className="fixed top-24 right-8 z-[60]">
           <OnboardingTooltip
             id="review-document"
             title="Review AI Analysis"
             description="The AI has extracted information from your document. Verify it's correct, make any edits, then click 'Approve & Save'."
             position="left"
             onDismiss={dismissTooltip}
           />
         </div>
       )}
    </div>
  );
};

export default App;
