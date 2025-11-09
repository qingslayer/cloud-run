import React, { useState, useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './config/firebase';
import { DocumentFile, ChatMessage as ChatMessageType, DocumentCategory, Theme, View, UniversalSearchResult } from './types';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Login from './components/Login';
import DocumentDetailView from './components/DocumentDetailView';
import DocumentReviewView from './components/DocumentReviewView';
import ToastContainer from './components/ToastContainer';
import ConfirmationModal from './components/ConfirmationModal';
import LoadingState from './components/LoadingState';
import UploadModal from './components/UploadModal';
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
  const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(null);
  const [selectedDocumentData, setSelectedDocumentData] = useState<DocumentFile | null>(null);
  const isLoadingDocumentRef = useRef(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [recordsFilter, setRecordsFilter] = useState<DocumentCategory | 'all'>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

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

  // State for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        // Load documents when user is authenticated
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

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array - only set up listener once on mount


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
      // Delete all documents in parallel and wait for all to complete
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

  const handleUpdateDocument = async (id: string, updates: Partial<DocumentFile>) => {
    try {
      // Never send 'id' field in updates - it's immutable
      const { id: _, ...safeUpdates } = updates as any;

      const updatedDoc = await apiUpdateDocument(id, safeUpdates);
      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === id ? updatedDoc : doc))
      );
    } catch (err) {
      console.error("Error updating document:", err);
      error("Failed to update document. Please try again.");
    }
  };

  const handleRequestDeleteDocument = (id: string) => {
    setDeleteConfirmation({
      isOpen: true,
      documentId: id,
      type: 'single',
      isDeleting: false
    });
  };

  const confirmDeleteDocument = async () => {
    const { documentId } = deleteConfirmation;
    if (!documentId) return;

    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      await apiDeleteDocument(documentId);
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

      // Close detail view if this document was open
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

  const handleDeleteReviewingDocument = (id: string) => {
    handleRequestDeleteDocument(id);
    setReviewingDocumentId(null);
  };

  const handleRemoveMultipleDocuments = (ids: string[]) => {
    ids.forEach(id => handleRequestDeleteDocument(id));
  };

  const selectedDocumentIdRef = useRef<string | null>(null);
  const reviewingDocumentIdRef = useRef<string | null>(null);
  const selectedDocumentDataRef = useRef<DocumentFile | null>(null);
  const lastSelectedDocumentIdRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    selectedDocumentIdRef.current = selectedDocumentId;
  }, [selectedDocumentId]);

  useEffect(() => {
    reviewingDocumentIdRef.current = reviewingDocumentId;
  }, [reviewingDocumentId]);

  useEffect(() => {
    selectedDocumentDataRef.current = selectedDocumentData;
  }, [selectedDocumentData]);

  const handleSelectDocument = useCallback(async (id: string) => {
    // Prevent multiple simultaneous calls
    if (isLoadingDocumentRef.current) {
      return;
    }

    // Check if document is already fully loaded and displayed
    const isCurrentlyDisplayed =
      (selectedDocumentIdRef.current === id || reviewingDocumentIdRef.current === id) &&
      selectedDocumentDataRef.current?.id === id;

    if (isCurrentlyDisplayed) {
      return;
    }

    isLoadingDocumentRef.current = true;
    lastSelectedDocumentIdRef.current = id;

    try {
      const fullDoc = await getDocument(id);

      // Update refs synchronously before setting state
      selectedDocumentDataRef.current = fullDoc;

      setSelectedDocumentData(fullDoc);

      if (fullDoc.status === 'review') {
        reviewingDocumentIdRef.current = id;
        selectedDocumentIdRef.current = null;
        setReviewingDocumentId(id);
        setSelectedDocumentId(null);
      } else if (fullDoc.status === 'complete') {
        selectedDocumentIdRef.current = id;
        reviewingDocumentIdRef.current = null;
        setSelectedDocumentId(id);
        setReviewingDocumentId(null);
      }
    } catch (err) {
      console.error("Error fetching document details:", err);
      error("Failed to load document. Please try again.");
      // Clear refs on error so user can retry
      selectedDocumentDataRef.current = null;
      lastSelectedDocumentIdRef.current = null;
    } finally {
      isLoadingDocumentRef.current = false;
    }
  }, [error]); // Include error function as dependency

  const handleCloseDocumentDetail = () => {
    selectedDocumentIdRef.current = null;
    selectedDocumentDataRef.current = null;
    lastSelectedDocumentIdRef.current = null;
    isLoadingDocumentRef.current = false;
    setSelectedDocumentId(null);
    setSelectedDocumentData(null);
  };

  const handleCloseReview = () => {
    reviewingDocumentIdRef.current = null;
    selectedDocumentDataRef.current = null;
    lastSelectedDocumentIdRef.current = null;
    isLoadingDocumentRef.current = false;
    setReviewingDocumentId(null);
    setSelectedDocumentData(null);
  };

  const handleConfirmReview = async (id: string, updatedData: Partial<DocumentFile>) => {
    try {
      await handleUpdateDocument(id, { ...updatedData, status: 'complete' });

      // Fetch the updated document to refresh the state with latest data
      const refreshedDoc = await getDocument(id);
      setDocuments(prevDocs =>
        prevDocs.map(doc => (doc.id === id ? refreshedDoc : doc))
      );

      setReviewingDocumentId(null);
      setSelectedDocumentData(null);
      success("Record saved successfully!");
    } catch (err) {
      console.error("Error confirming review:", err);
      error("Failed to save record. Please try again.");
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessageType = { id: Date.now().toString(), role: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message with chat history and sessionId to backend
      const result = await sendChatMessage(message, chatMessages, chatSessionId || undefined);

      // Store session ID for subsequent messages
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

    // Clear chat messages and session when starting new search
    setChatMessages([]);
    setChatSessionId(null);

    setSearchQuery(query);
    setIsSearchLoading(true);
    setPageSearchResults(null);
    setView('search');

    try {
      // Backend handles AI vs simple search logic
      const searchResult = await processUniversalSearch(query);
      setPageSearchResults(searchResult);

      // If search opened a chat session, store the sessionId
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

    // Handle answer, summary, or chat types
    const isValidForFollowUp =
      (pageSearchResults.type === 'answer' && pageSearchResults.answer) ||
      (pageSearchResults.type === 'summary' && pageSearchResults.summary) ||
      (pageSearchResults.type === 'chat' && pageSearchResults.answer);

    if (!isValidForFollowUp) return;

    // Set initial chat history from search
    const responseText = pageSearchResults.type === 'summary'
      ? pageSearchResults.summary
      : pageSearchResults.answer;

    const initialHistory: ChatMessageType[] = [
      { id: 'followup-0', role: 'user', text: searchQuery },
      { id: 'followup-1', role: 'model', text: responseText },
    ];

    setChatMessages(initialHistory);

    // If this was a chat-type result, preserve the sessionId
    if (pageSearchResults.type === 'chat') {
      setChatSessionId(pageSearchResults.sessionId);
    }

    setView('dashboard');
    setIsRightPanelOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear application state
      setDocuments([]);
      setChatMessages([]);
      setView('dashboard');
      setIsRightPanelOpen(false);
      setSelectedDocumentId(null);
      setReviewingDocumentId(null);
    } catch (err) {
      console.error('Error signing out:', err);
      error("Failed to sign out. Please try again.");
    }
  };

  const reviewingDocument = reviewingDocumentId ? selectedDocumentData : null;
  const selectedDocument = selectedDocumentId ? selectedDocumentData : null;

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return <LoadingState message="Loading..." fullScreen />;
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  if (selectedDocument) {
    return <DocumentDetailView document={selectedDocument} onClose={handleCloseDocumentDetail} onUpdate={handleUpdateDocument} onDelete={handleRequestDeleteDocument} />;
  }

  const renderMainContent = () => {
    switch(view) {
        case 'dashboard':
            return <Dashboard documents={documents} onNavigateToRecords={handleNavigateToRecords} onSelectDocument={handleSelectDocument} onUploadClick={() => setIsUploadModalOpen(true)} isLoading={isDocumentsLoading} />;
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
                   />;
        case 'settings':
            return <Settings theme={theme} setTheme={setTheme} onDeleteAllRecords={handleDeleteAllRecords} />;
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
        />
        <main className="flex-1 overflow-y-auto">
          {renderMainContent()}
        </main>

        <RightPanel
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          hasDocuments={documents.filter(d => d.status === 'complete').length > 0}
        />

       {reviewingDocument && (
        <DocumentReviewView
          document={reviewingDocument}
          onSave={handleConfirmReview}
          onClose={handleCloseReview}
          onDelete={handleDeleteReviewingDocument}
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

       <UploadModal
         isOpen={isUploadModalOpen}
         onClose={() => setIsUploadModalOpen(false)}
         onFilesChange={handleFilesChange}
         onUpdateDocument={handleUpdateDocument}
         onError={error}
       />

       <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default App;
