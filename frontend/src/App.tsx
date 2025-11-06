import React, { useState, useCallback, useEffect } from 'react';
import { DocumentFile, ChatMessage as ChatMessageType, DocumentCategory, Theme, View, UniversalSearchResult } from './types';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Login from './components/Login';
import { sampleDocuments } from './sample-data';
import DocumentDetailView from './components/DocumentDetailView';
import DocumentReviewView from './components/DocumentReviewView';
import SuccessToast from './components/SuccessToast';
import RightPanel from './components/RightPanel';
import Settings from './components/Settings';
import TopCommandBar from './components/TopCommandBar';
import SearchResultsPage from './components/SearchResultsPage';
import { sendChatMessage } from './services/chatService';
import { processUniversalSearch } from './services/searchService';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<View>('dashboard');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [reviewingDocumentId, setReviewingDocumentId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [recordsFilter, setRecordsFilter] = useState<DocumentCategory | 'all'>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // State for integrated search flow
  const [pageSearchResults, setPageSearchResults] = useState<UniversalSearchResult | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


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
        setDocuments([]);
    }
  };

  const handleFilesChange = (newFiles: DocumentFile[]) => {
    setDocuments(prevDocs => [...newFiles, ...prevDocs]);
  };

  const handleUpdateDocument = (id: string, updates: Partial<DocumentFile>) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
  };

  const handleDeleteReviewingDocument = (id: string) => {
    handleRemoveDocument(id);
    setReviewingDocumentId(null);
  };

  const handleRemoveMultipleDocuments = (ids: string[]) => {
    setDocuments(prevDocs => prevDocs.filter(doc => !ids.includes(doc.id)));
  };

  const handleSelectDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    if (doc.status === 'review') {
      setReviewingDocumentId(id);
    } else if (doc.status === 'complete') {
      setSelectedDocumentId(id);
    }
  };

  const handleCloseDocumentDetail = () => {
    setSelectedDocumentId(null);
  };
  
  const handleCloseReview = () => {
    setReviewingDocumentId(null);
  };

  const handleConfirmReview = (id: string, updatedData: Partial<DocumentFile>) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === id 
          ? { ...doc, ...updatedData, status: 'complete' } 
          : doc
      )
    );
    setReviewingDocumentId(null);
    setShowSuccessToast(true);
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessageType = { id: Date.now().toString(), role: 'user', text: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        // Send message with chat history to backend
        const result = await sendChatMessage(message, chatMessages);
        
        const aiMessage: ChatMessageType = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: result.text 
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

    // Clear chat messages when starting new search
    setChatMessages([]);

    setSearchQuery(query);
    setIsSearchLoading(true);
    setPageSearchResults(null);
    setView('search');

    try {
        // Backend handles AI vs simple search logic
        const searchResult = await processUniversalSearch(query);
        setPageSearchResults(searchResult);
    } catch (error) {
        console.error("Search failed:", error);
        setPageSearchResults({ 
          type: 'answer', 
          answer: 'Sorry, an error occurred during the search.', 
          sources: [] 
        });
    } finally {
        setIsSearchLoading(false);
    }
  };

  const handleAskFollowUp = () => {
    if (pageSearchResults?.type !== 'answer' || !pageSearchResults.answer) return;

    // Set initial chat history from search
    const initialHistory: ChatMessageType[] = [
        { id: 'followup-0', role: 'user', text: searchQuery },
        { id: 'followup-1', role: 'model', text: pageSearchResults.answer },
    ];

    setChatMessages(initialHistory);
    
    setView('dashboard');
    setIsRightPanelOpen(true);
  };

  const handleLogin = () => {
    setDocuments(sampleDocuments);
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setDocuments([]);
    setChatMessages([]);
    setView('dashboard');
  };

  const reviewingDocument = documents.find(doc => doc.id === reviewingDocumentId);
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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