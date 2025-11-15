# Frontend UX Improvements - Action Items

Quick reference guide for implementing UX improvements to Health Vault frontend.

## 🔴 Priority 1: Critical Fixes (Implement First)

### 1. Add Keyboard Shortcuts System
**Files to modify:**
- `frontend/src/App.tsx` - Add global keyboard listener
- `frontend/src/components/KeyboardShortcutsHelp.tsx` - New component for help modal

**Shortcuts to implement:**
```typescript
ESC              → Close modals/panels/detail views
Cmd/Ctrl + K     → Focus search bar
Cmd/Ctrl + U     → Open upload modal
Cmd/Ctrl + /     → Show keyboard shortcuts help
Arrow Left/Right → Navigate between documents in detail view
```

**Implementation:**
```typescript
// In App.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Close modals/panels
      setIsRightPanelOpen(false);
      if (selectedDocumentId) handleCloseDocumentDetail();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // Focus search input
      document.querySelector('input[type="text"]')?.focus();
    }
    // ... more shortcuts
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [/* dependencies */]);
```

---

### 2. Add Document Navigation (Prev/Next)
**Files to modify:**
- `frontend/src/components/DocumentDetailView.tsx`
- `frontend/src/App.tsx` - Update state to track document list context

**Changes:**
```typescript
// Add to DocumentDetailView props
interface DocumentDetailViewProps {
  document: DocumentFile;
  allDocuments: DocumentFile[]; // NEW: Full filtered list
  currentIndex: number;          // NEW: Position in list
  onNavigate: (direction: 'prev' | 'next') => void; // NEW
  // ... existing props
}

// Add navigation header
<div className="flex items-center gap-3">
  <button
    onClick={() => onNavigate('prev')}
    disabled={currentIndex === 0}
    className="p-2 rounded-lg hover:bg-slate-100"
  >
    ← Previous
  </button>

  <span className="text-sm text-slate-500">
    {currentIndex + 1} of {allDocuments.length}
  </span>

  <button
    onClick={() => onNavigate('next')}
    disabled={currentIndex === allDocuments.length - 1}
    className="p-2 rounded-lg hover:bg-slate-100"
  >
    Next →
  </button>
</div>

// Add keyboard navigation
useEffect(() => {
  const handleArrowKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      onNavigate('prev');
    } else if (e.key === 'ArrowRight' && currentIndex < allDocuments.length - 1) {
      onNavigate('next');
    }
  };

  document.addEventListener('keydown', handleArrowKey);
  return () => document.removeEventListener('keydown', handleArrowKey);
}, [currentIndex, allDocuments.length]);
```

---

### 3. Improve Upload Button Visibility
**Files to modify:**
- `frontend/src/components/Dashboard.tsx` - Add upload zones to category tiles
- `frontend/src/components/Records.tsx` - Add drag-and-drop to page
- `frontend/src/components/TopCommandBar.tsx` - Consider FAB alternative

**Option A: Add contextual upload to category tiles**
```typescript
// In Dashboard.tsx - CategoryTile component
const CategoryTile: React.FC<{ category: DocumentCategory; count: number; onClick: () => void; onUpload: () => void }> = ({ category, count, onClick, onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        // Handle upload with category pre-selected
        handleUploadToCategory(files, category);
      }}
      className={`category-tile ${isDragging ? 'border-teal-500 bg-teal-50' : ''}`}
    >
      {/* Existing tile content */}

      {/* Upload button on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onUpload(); }}
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <UploadIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
```

**Option B: Add floating action button (FAB)**
```typescript
// New component: FloatingUploadButton.tsx
const FloatingUploadButton: React.FC = () => {
  return (
    <button
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-2xl hover:scale-110 transition-transform"
      onClick={handleOpenUpload}
    >
      <UploadIcon className="w-6 h-6 mx-auto" />
    </button>
  );
};
```

---

### 4. Add Bulk Operations
**Files to modify:**
- `frontend/src/components/Records.tsx` - Add selection state
- `frontend/src/components/DocumentCard.tsx` - Add checkbox
- `frontend/src/components/BulkActionsToolbar.tsx` - New component

**Implementation:**
```typescript
// In Records.tsx
const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
const [isBulkMode, setIsBulkMode] = useState(false);

const toggleSelect = (id: string) => {
  setSelectedDocIds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  });
};

const selectAll = () => {
  setSelectedDocIds(new Set(sortedAndFilteredDocuments.map(d => d.id)));
};

const deselectAll = () => {
  setSelectedDocIds(new Set());
  setIsBulkMode(false);
};

// Bulk actions
const handleBulkDelete = async () => {
  const ids = Array.from(selectedDocIds);
  await Promise.all(ids.map(id => onRemoveDocument(id)));
  deselectAll();
};

const handleBulkCategorize = async (newCategory: DocumentCategory) => {
  const ids = Array.from(selectedDocIds);
  await Promise.all(ids.map(id => onUpdateDocument(id, { category: newCategory })));
  deselectAll();
};

// Render bulk toolbar
{selectedDocIds.size > 0 && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center gap-4">
    <span className="text-sm font-semibold">{selectedDocIds.size} selected</span>
    <button onClick={handleBulkDelete} className="btn-danger">
      Delete
    </button>
    <button onClick={() => setShowCategoryMenu(true)} className="btn-secondary">
      Change Category
    </button>
    <button onClick={deselectAll} className="btn-ghost">
      <XIcon className="w-4 h-4" />
    </button>
  </div>
)}
```

```typescript
// In DocumentCard.tsx - add checkbox
interface DocumentCardProps {
  // ... existing props
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

// In card render
{isSelectable && (
  <input
    type="checkbox"
    checked={isSelected}
    onChange={() => onToggleSelect?.(document.id)}
    onClick={(e) => e.stopPropagation()}
    className="absolute top-3 left-3 w-5 h-5 rounded border-2 border-slate-300"
  />
)}
```

---

### 5. Basic Accessibility Improvements
**Files to modify:** All components with interactive elements

**Priority fixes:**
```typescript
// Add ARIA labels to icon buttons
<button aria-label="Close panel" onClick={onClose}>
  <XIcon className="w-5 h-5" />
</button>

// Add role attributes to custom components
<div role="navigation" aria-label="Main navigation">
  {/* Navigation items */}
</div>

// Ensure modals have proper focus management
useEffect(() => {
  if (isOpen) {
    // Focus first interactive element
    const firstButton = modalRef.current?.querySelector('button, input');
    firstButton?.focus();
  }
}, [isOpen]);

// Add focus trap for modals
const trapFocus = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }
};
```

---

## ⚠️ Priority 2: Navigation & Context

### 6. Add Breadcrumb Navigation
**Files to create:**
- `frontend/src/components/Breadcrumbs.tsx` - New component

**Files to modify:**
- `frontend/src/App.tsx` - Add breadcrumb state tracking
- `frontend/src/components/TopCommandBar.tsx` - Display breadcrumbs

**Implementation:**
```typescript
// Breadcrumbs.tsx
interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRightIcon className="w-4 h-4 text-slate-400" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-slate-600 hover:text-teal-600 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-400">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Usage in App.tsx
const getBreadcrumbs = (): BreadcrumbItem[] => {
  const crumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', onClick: () => setView('dashboard') }
  ];

  if (view === 'records') {
    crumbs.push({
      label: recordsFilter === 'all' ? 'All Records' : recordsFilter,
    });
  } else if (view === 'search') {
    crumbs.push({ label: `Search: "${searchQuery}"` });
  } else if (view === 'settings') {
    crumbs.push({ label: 'Settings' });
  }

  if (selectedDocumentId && selectedDocumentData) {
    crumbs.push({ label: selectedDocumentData.displayName });
  }

  return crumbs;
};
```

---

### 7. Add Search History & Auto-complete
**Files to modify:**
- `frontend/src/components/TopCommandBar.tsx` - Search input
- `frontend/src/components/SearchDropdown.tsx` - New component for suggestions

**Implementation:**
```typescript
// In TopCommandBar.tsx
const [searchHistory, setSearchHistory] = useState<string[]>(() => {
  const stored = localStorage.getItem('searchHistory');
  return stored ? JSON.parse(stored) : [];
});

const [showSuggestions, setShowSuggestions] = useState(false);

const addToHistory = (query: string) => {
  const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10);
  setSearchHistory(newHistory);
  localStorage.setItem('searchHistory', JSON.stringify(newHistory));
};

const handleSearchSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (query.trim()) {
    addToHistory(query.trim());
    onSearch(query);
    setQuery('');
    setShowSuggestions(false);
  }
};

// Suggestions dropdown
{showSuggestions && searchHistory.length > 0 && (
  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border">
    <div className="p-2">
      <p className="text-xs font-semibold text-slate-500 px-3 py-1">Recent Searches</p>
      {searchHistory.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            setQuery(item);
            onSearch(item);
            setShowSuggestions(false);
          }}
          className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 text-sm"
        >
          <ClockIcon className="inline w-4 h-4 mr-2 text-slate-400" />
          {item}
        </button>
      ))}
    </div>
  </div>
)}
```

---

### 8. Add Advanced Search Filters
**Files to create:**
- `frontend/src/components/SearchFilters.tsx` - New component

**Files to modify:**
- `frontend/src/components/SearchResultsPage.tsx` - Add filter panel

**Implementation:**
```typescript
// SearchFilters.tsx
interface SearchFiltersProps {
  onFilterChange: (filters: SearchFilters) => void;
}

interface SearchFilters {
  categories: DocumentCategory[];
  dateRange: { start: Date | null; end: Date | null };
  fileTypes: string[];
  sortBy: 'relevance' | 'date' | 'name';
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    dateRange: { start: null, end: null },
    fileTypes: [],
    sortBy: 'relevance'
  });

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
      <h3 className="font-semibold mb-3">Filters</h3>

      {/* Category checkboxes */}
      <div className="mb-4">
        <label className="text-sm font-medium">Categories</label>
        {/* Render category checkboxes */}
      </div>

      {/* Date range */}
      <div className="mb-4">
        <label className="text-sm font-medium">Date Range</label>
        {/* Date picker inputs */}
      </div>

      {/* Sort by */}
      <div>
        <label className="text-sm font-medium">Sort By</label>
        <select onChange={(e) => updateFilter('sortBy', e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="date">Date</option>
          <option value="name">Name</option>
        </select>
      </div>
    </div>
  );
};
```

---

## 💡 Priority 3: Enhanced Features

### 9. Improve Chat Panel (Resizable, Minimize)
**Files to modify:**
- `frontend/src/components/RightPanel.tsx`

**Add resize functionality:**
```typescript
const [panelWidth, setPanelWidth] = useState(384); // 24rem = 384px
const [isMinimized, setIsMinimized] = useState(false);
const [isDragging, setIsDragging] = useState(false);

const handleMouseDown = () => setIsDragging(true);

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newWidth = window.innerWidth - e.clientX - 16;
      setPanelWidth(Math.max(300, Math.min(800, newWidth)));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDragging]);

// Render with dynamic width
<aside
  style={{ width: isMinimized ? '64px' : `${panelWidth}px` }}
  className={`fixed top-4 right-4 bottom-4 z-40 ...`}
>
  {/* Resize handle */}
  <div
    onMouseDown={handleMouseDown}
    className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-teal-500"
  />

  {/* Minimize button */}
  <button onClick={() => setIsMinimized(!isMinimized)}>
    {isMinimized ? <MaximizeIcon /> : <MinimizeIcon />}
  </button>

  {!isMinimized && (
    <ChatPanel {...props} />
  )}
</aside>
```

---

### 10. Add Category Selection to Upload
**Files to modify:**
- `frontend/src/components/DocumentUploader.tsx`
- `frontend/src/services/documentProcessor.ts`

**Implementation:**
```typescript
// In DocumentUploader.tsx
const [fileCategories, setFileCategories] = useState<Map<string, DocumentCategory>>(new Map());

const handleFileChange = async (files: FileList | null) => {
  if (!files || files.length === 0) return;

  // Initialize categories for each file
  const categoryMap = new Map<string, DocumentCategory>();
  Array.from(files).forEach(file => {
    categoryMap.set(file.name, 'Other'); // Default
  });
  setFileCategories(categoryMap);

  // Show category selection UI
  setShowCategorySelector(true);
};

// Category selector UI
{showCategorySelector && (
  <div className="space-y-2 mb-4">
    <h4 className="font-semibold text-sm">Set categories for your files:</h4>
    {Array.from(fileCategories).map(([filename, category]) => (
      <div key={filename} className="flex items-center gap-2">
        <span className="text-sm flex-1 truncate">{filename}</span>
        <select
          value={category}
          onChange={(e) => {
            const newMap = new Map(fileCategories);
            newMap.set(filename, e.target.value as DocumentCategory);
            setFileCategories(newMap);
          }}
          className="text-sm border rounded px-2 py-1"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    ))}

    <button
      onClick={handleStartUpload}
      className="w-full py-2 bg-teal-600 text-white rounded-lg"
    >
      Upload All
    </button>
  </div>
)}
```

---

### 11. Add Loading Skeleton States
**Files to create:**
- `frontend/src/components/skeletons/SkeletonDocumentCard.tsx`
- `frontend/src/components/skeletons/SkeletonCategoryTile.tsx`
- `frontend/src/components/skeletons/SkeletonDetailView.tsx`

**Implementation:**
```typescript
// SkeletonDocumentCard.tsx
const SkeletonDocumentCard: React.FC = () => {
  return (
    <div className="flex items-center p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-stone-200 dark:border-slate-800 animate-pulse">
      {/* Icon placeholder */}
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 mr-4" />

      {/* Content placeholder */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>

      {/* Actions placeholder */}
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
    </div>
  );
};

// Usage in Records.tsx
{isDocumentsLoading ? (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => <SkeletonDocumentCard key={i} />)}
  </div>
) : (
  // Actual documents
)}
```

---

### 12. Add Drag-and-Drop to Dashboard & Records
**Files to modify:**
- `frontend/src/components/Dashboard.tsx`
- `frontend/src/components/Records.tsx`

**Implementation:**
```typescript
// Add page-level drop zone
const [isDraggingOver, setIsDraggingOver] = useState(false);

const handlePageDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  setIsDraggingOver(false);

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    // Handle upload
    await handleFileUpload(files);
  }
};

return (
  <div
    onDragEnter={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
    onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
    onDragOver={(e) => e.preventDefault()}
    onDrop={handlePageDrop}
    className={`h-full ${isDraggingOver ? 'bg-teal-50 dark:bg-teal-900/10' : ''}`}
  >
    {isDraggingOver && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-500/20 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          <UploadIcon className="w-16 h-16 mx-auto mb-4 text-teal-500" />
          <h2 className="text-2xl font-bold">Drop files to upload</h2>
          <p className="text-slate-500 mt-2">Release to start uploading</p>
        </div>
      </div>
    )}

    {/* Regular content */}
  </div>
);
```

---

## Quick Implementation Checklist

### Week 1
- [ ] Implement keyboard shortcuts system
- [ ] Add document prev/next navigation
- [ ] Improve upload button visibility (FAB or contextual)

### Week 2
- [ ] Add bulk selection and operations
- [ ] Basic accessibility improvements (ARIA labels, focus management)
- [ ] Add breadcrumb navigation

### Week 3
- [ ] Implement search history and auto-complete
- [ ] Add loading skeleton states
- [ ] Improve chat panel (resize, minimize)

### Week 4
- [ ] Add category selection to upload flow
- [ ] Implement drag-and-drop everywhere
- [ ] Add advanced search filters

---

## Testing Checklist

After implementing each feature:

- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Test on mobile devices
- [ ] Test in dark mode
- [ ] Test with slow network
- [ ] Test with many documents (100+)
- [ ] Test cross-browser (Chrome, Firefox, Safari, Edge)
- [ ] Verify no console errors
- [ ] Check performance (no layout shift, smooth animations)
- [ ] Validate TypeScript types

---

## Notes

- All components should maintain existing dark mode support
- Maintain responsive design for mobile/tablet
- Use existing Tailwind color palette and design tokens
- Follow existing code patterns and conventions
- Add proper TypeScript types for all new interfaces
- Update relevant tests when modifying components
- Consider adding Storybook stories for new components

---

**Last Updated:** 2025-11-15
