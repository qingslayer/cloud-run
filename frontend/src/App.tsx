import React, { useState, useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './config/firebase';
import { DocumentFile, ChatMessage as ChatMessageType, DocumentCategory, Theme, View, UniversalSearchResult } from './types';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Login from './components/Login';
import DocumentDetailView from './components/DocumentDetailView';
import DocumentReviewView from './components/DocumentReviewView';
import SuccessToast from './components/SuccessToast';
import RightPanel from './components/RightPanel';
import Settings from './components/Settings';
import TopCommandBar from './components/TopCommandBar';
import SearchResultsPage from './components/SearchResultsPage';
import { sendChatMessage } from './services/chatService';
import { processUniversalSearch } from './services/searchService';
import { getDocuments, uploadDocument, updateDocument as apiUpdateDocument, deleteDocument as apiDeleteDocument, getDocument } from './services/documentProcessor';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(null);
  const [selectedDocumentData, setSelectedDocumentData] = useState<DocumentFile | null>(null);
  const isLoadingDocumentRef = useRef(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [recordsFilter, setRecordsFilter] = useState<DocumentCategory | 'all'>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // State for integrated search flow
  const [pageSearchResults, setPageSearchResults] = useState<UniversalSearchResult | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        // Load documents when user is authenticated
        getDocuments().then(({ documents: fetchedDocuments }) => {
          setDocuments(fetchedDocuments);
        }).catch((error) => {
          console.error("Error loading documents:", error);
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
    if (window.confirm("Are you sure you want to delete all your records? This action cannot be undone.")) {
        documents.forEach(doc => apiDeleteDocument(doc.id));
        setDocuments([]);
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
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleRemoveDocument = async (id: string) => {
    try {
      await apiDeleteDocument(id);
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleDeleteReviewingDocument = (id: string) => {
    handleRemoveDocument(id);
    setReviewingDocumentId(null);
  };

  const handleRemoveMultipleDocuments = (ids: string[]) => {
    ids.forEach(id => handleRemoveDocument(id));
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
    } catch (error) {
      console.error("Error fetching document:", error);
      // Clear refs on error so user can retry
      selectedDocumentDataRef.current = null;
      lastSelectedDocumentIdRef.current = null;
    } finally {
      isLoadingDocumentRef.current = false;
    }
  }, []); // Empty dependencies - use refs only to avoid function recreation

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

  const handleConfirmReview = (id: string, updatedData: Partial<DocumentFile>) => {
    handleUpdateDocument(id, { ...updatedData, status: 'complete' });
    setReviewingDocumentId(null);
    setShowSuccessToast(true);
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

    } catch (error) {
        console.error('Error in chat:', error);
        const errorMessage: ChatMessageType = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: 'Sorry, I encountered an error. Please try again.',
        };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [chatMessages]);
  
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
    } catch (error) {
        console.error("Search failed:", error);
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
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const reviewingDocument = reviewingDocumentId ? selectedDocumentData : null;
  const selectedDocument = selectedDocumentId ? selectedDocumentData : null;

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-[#0B1120]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }
  
  if (selectedDocument) {
    return <DocumentDetailView document={selectedDocument} onClose={handleCloseDocumentDetail} />;
  }

  const renderMainContent = () => {
    switch(view) {
        case 'dashboard':
            return <Dashboard documents={documents} onNavigateToRecords={handleNavigateToRecords} onSelectDocument={handleSelectDocument} />;
        case 'records':
            return <Records 
                        initialFilter={recordsFilter} 
                        documents={documents} 
                        onFilesChange={handleFilesChange} 
                        onUpdateDocument={handleUpdateDocument} 
                        onRemoveDocument={handleRemoveDocument} 
                        onRemoveMultipleDocuments={handleRemoveMultipleDocuments} 
                        onSelectDocument={handleSelectDocument} 
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
       <SuccessToast 
        show={showSuccessToast} 
        onClose={() => setShowSuccessToast(false)}
        message="Record saved successfully!"
       />
    </div>
  );
};

export default App;