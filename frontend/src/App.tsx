import React, { useState, useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './config/firebase';
import { DocumentFile, ChatMessage as ChatMessageType, DocumentCategory, Theme, View, UniversalSearchResult } from './types';
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
import { sendChatMessage } from './services/chatService';
import { processUniversalSearch } from './services/searchService';
import { getDocuments, uploadDocument, updateDocument as apiUpdateDocument, deleteDocument as apiDeleteDocument, getDocument } from './services/documentProcessor';
import { useToast } from './hooks/useToast';

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
  const isLoadingDocumentRef = useRef(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [recordsFilter, setRecordsFilter] = useState<DocumentCategory | 'all'>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [viewedDocuments, setViewedDocuments] = useState<Set<string>>(() => {
    // Load viewed documents from localStorage
    const stored = localStorage.getItem('viewedDocuments');
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
          error("Failed to load your documents. Please refresh the page.");
          setIsDocumentsLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      root.classList.toggle('dark', isDark);
    };

    applyTheme();
    localStorage.setItem('theme', theme);

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
      success("All records deleted successfully");
      setDeleteConfirmation({ isOpen: false, type: 'all', isDeleting: false });
    } catch (err) {
      console.error("Error deleting all records:", err);
      error("Failed to delete some records. Please try again.");
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleFilesChange = (newFiles: DocumentFile[]) => {
    setDocuments(prevDocs => [...newFiles, ...prevDocs]);
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

      success("Document updated successfully!");

    } catch (err) {
      console.error("Error updating document:", err);
      error("Failed to update document. Please try again.");
    }
  }, [selectedDocumentId, success, error]);

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

      success("Document deleted successfully");
      setDeleteConfirmation({ isOpen: false, type: 'single', isDeleting: false });
    } catch (err) {
      console.error("Error deleting document:", err);
      error("Failed to delete document. Please try again.");
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

  const handleSelectDocument = useCallback(async (id: string) => {
    if (isLoadingDocumentRef.current) {
      return;
    }

    const isCurrentlyDisplayed =
      (selectedDocumentIdRef.current === id) &&
      selectedDocumentDataRef.current?.id === id;

    if (isCurrentlyDisplayed) {
      return;
    }

    isLoadingDocumentRef.current = true;
    lastSelectedDocumentIdRef.current = id;

    try {
      const fullDoc = await getDocument(id);

      selectedDocumentDataRef.current = fullDoc;
      setSelectedDocumentData(fullDoc);

      selectedDocumentIdRef.current = id;
      setSelectedDocumentId(id);

      setViewedDocuments(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        localStorage.setItem('viewedDocuments', JSON.stringify(Array.from(newSet)));
        return newSet;
      });

    } catch (err) {
      console.error("Error fetching document details:", err);
      error("Failed to load document. Please try again.");
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
  };

  // Get current document navigation context
  const getNavigationContext = () => {
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
  };

  const handleNavigateDocument = (direction: 'prev' | 'next') => {
    const { allDocuments, currentIndex } = getNavigationContext();

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
  };

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

    setChatMessages([]);
    setChatSessionId(null);

    setSearchQuery(query);
    setIsSearchLoading(true);
    setPageSearchResults(null);
    setView('search');

    try {
      const searchResult = await processUniversalSearch(query);
      setPageSearchResults(searchResult);

      if (searchResult.type === 'chat') {
        setChatSessionId(searchResult.sessionId);
      }
    } catch (err) {
      console.error("Search failed:", err);
      error("Search failed. Please try again.");
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
      error("Failed to sign out. Please try again.");
    }
  };

  const selectedDocument = selectedDocumentId ? selectedDocumentData : null;

  // Generate breadcrumbs based on current view
  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; onClick?: () => void }> = [];

    // Always start with Home (unless we're on Dashboard and no document is selected)
    if (view !== 'dashboard' || selectedDocumentId) {
      crumbs.push({
        label: 'Home',
        onClick: () => {
          setView('dashboard');
          setRecordsFilter('all');
        }
      });
    }

    // Add view-specific crumbs
    if (view === 'records') {
      crumbs.push({
        label: recordsFilter === 'all' ? 'All Records' : recordsFilter,
        onClick: selectedDocumentId ? () => { /* Stay on records but close detail */ } : undefined
      });
    } else if (view === 'search') {
      crumbs.push({
        label: `Search: "${searchQuery.substring(0, 30)}${searchQuery.length > 30 ? '...' : ''}"`,
      });
    } else if (view === 'settings') {
      crumbs.push({ label: 'Settings' });
    }

    // Add document if one is selected
    if (selectedDocumentId && selectedDocumentData) {
      crumbs.push({
        label: selectedDocumentData.displayName || 'Document'
      });
    }

    return crumbs;
  };

  if (isAuthLoading) {
    return <LoadingState message="Loading..." fullScreen />;
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
            return <Settings theme={theme} setTheme={setTheme} onDeleteAllRecords={handleDeleteAllRecords} currentUser={currentUser} />;
        case 'search':
            return <SearchResultsPage
                        results={pageSearchResults}
                        isLoading={isSearchLoading}
                        onSelectDocument={handleSelectDocument}
                        onAskFollowUp={handleAskFollowUp}
                        query={searchQuery}
                   />;
    }
  }

  return (
     <div className="font-sans h-screen overflow-hidden flex flex-col">
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
          breadcrumbs={getBreadcrumbs()}
          onBack={selectedDocumentId ? handleCloseDocumentDetail : undefined}
          navigationContext={selectedDocumentId ? {
            currentIndex: getNavigationContext().currentIndex,
            total: getNavigationContext().allDocuments.length,
            hasPrev: getNavigationContext().hasPrev,
            hasNext: getNavigationContext().hasNext
          } : undefined}
          onNavigate={selectedDocumentId ? handleNavigateDocument : undefined}
        />

        <main className={`flex-1 overflow-y-auto pt-20 transition-all duration-300 ${isRightPanelOpen ? 'pr-[25rem]' : ''}`}>
          {selectedDocument ? (
            <DocumentDetailView
              documentData={selectedDocument}
              onClose={handleCloseDocumentDetail}
              onUpdate={handleUpdateDocument}
              onDelete={handleRequestDeleteDocument}
              navigationContext={getNavigationContext()}
              onNavigate={handleNavigateDocument}
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
    </div>
  );
};

export default App;
