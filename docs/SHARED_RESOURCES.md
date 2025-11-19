# Shared Resources & Component Library

**Last Updated:** 2025-01-19

This is a living document that catalogs all shared, reusable code in the HealthVault application. Reference this when building new features to avoid duplicating existing functionality.

---

## Table of Contents

- [Configuration](#configuration)
- [Hooks](#hooks)
- [Common Components](#common-components)
- [Utilities](#utilities)
- [Services](#services)
- [Type Definitions](#type-definitions)
- [Icons & Illustrations](#icons--illustrations)

---

## Configuration

### `/frontend/src/config/constants.ts`

Centralized constants used across the application.

**Categories:**
```typescript
CATEGORIES: readonly DocumentCategory[]
// ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other']
```

**Timeouts (in milliseconds):**
```typescript
TIMEOUTS = {
  POLL_INTERVAL: 5000,        // Document processing polling
  TOAST_DEFAULT: 4000,         // Default toast notification duration
  SUCCESS_TOAST: 3000,         // Success toast duration
  SETTINGS_SAVE_HIDE: 3000,   // Settings save message duration
  SCROLL_CHECK: 300,           // Scroll button check delay
  INITIAL_FETCH: 100,          // Initial document fetch delay
}
```

**localStorage Keys:**
```typescript
STORAGE_KEYS = {
  THEME: 'theme',                         // User theme preference
  VIEWED_DOCS: 'viewedDocuments',         // Set of viewed document IDs
  ONBOARDING: 'healthvault_onboarding',   // Onboarding state
}
```

**Usage:**
```typescript
import { CATEGORIES, TIMEOUTS, STORAGE_KEYS } from '../config/constants';
```

---

### `/frontend/src/config/messages.ts`

Centralized UI messages, errors, and text content.

**Available message categories:**
- `MESSAGES.PROCESSING` - AI processing time estimates
- `MESSAGES.DELETE` - Deletion confirmations
- `MESSAGES.LOADING` - Loading states
- `MESSAGES.ERRORS` - Error messages
- `MESSAGES.SUCCESS` - Success messages

**Usage:**
```typescript
import { MESSAGES } from '../config/messages';

error(MESSAGES.ERRORS.LOAD_DOCUMENTS);
success(MESSAGES.SUCCESS.DOCUMENT_DELETED);
```

---

## Hooks

### `/frontend/src/hooks/useToast.ts`

Toast notification system hook.

**Features:**
- Add toast notifications (success, error, warning, info)
- Auto-dismiss with configurable duration
- Multiple simultaneous toasts

**Usage:**
```typescript
const { success, error, warning, info } = useToast();

success("Document saved!");
error("Failed to load document");
```

---

### `/frontend/src/hooks/useOnboarding.ts`

Onboarding state management hook.

**Features:**
- Track user onboarding progress
- Show/hide welcome modals and tooltips
- Persist state to localStorage

**Usage:**
```typescript
const { state, markComplete, dismissTooltip, shouldShowTooltip, resetOnboarding } = useOnboarding();

if (!state.hasSeenWelcome) {
  setShowWelcomeModal(true);
}

markComplete('hasUploadedFirstDocument');
```

---

### `/frontend/src/hooks/useClickOutside.ts`

Detect clicks outside of a specified element.

**Features:**
- Close dropdowns, modals, menus on outside click
- Supports both mouse and touch events
- Optional enable/disable parameter

**Usage:**
```typescript
import { useClickOutside } from '../hooks/useClickOutside';

const menuRef = useRef<HTMLDivElement>(null);
useClickOutside(menuRef, () => setIsMenuOpen(false), isMenuOpen);
```

---

## Common Components

### `/frontend/src/components/common/EditableInput.tsx`

Reusable text input with consistent styling.

**Props:**
```typescript
{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  className?: string;
}
```

**Features:**
- Consistent dark mode styling
- Pre-configured focus states
- Used in all editable forms

**Usage:**
```typescript
import EditableInput from './common/EditableInput';

<EditableInput
  value={name}
  onChange={setName}
  placeholder="Enter name"
/>
```

---

### `/frontend/src/components/common/EditableTextArea.tsx`

Reusable textarea with consistent styling.

**Props:**
```typescript
{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}
```

**Usage:**
```typescript
import EditableTextArea from './common/EditableTextArea';

<EditableTextArea
  value={notes}
  onChange={setNotes}
  placeholder="Add notes..."
  rows={4}
/>
```

---

## Utilities

### `/frontend/src/utils/formatters.ts`

Text and data formatting utilities.

**Available functions:**
- `formatRelativeTime(date: Date): string` - Format dates as "2 hours ago", "3 days ago", etc.
- `formatBytes(bytes: number): string` - Format file sizes as "2.5 MB", "150 KB", etc.
- `renderMarkdown(text: string): JSX.Element` - Render markdown text with syntax highlighting
- `groupDocumentsByMonth(documents): Record<string, DocumentFile[]>` - Group documents by month/year

**Usage:**
```typescript
import { formatRelativeTime, formatBytes } from '../utils/formatters';

const timeAgo = formatRelativeTime(document.uploadDate);
const fileSize = formatBytes(document.size);
```

---

### `/frontend/src/utils/category-info.ts`

Category metadata and styling information.

**Provides:**
- Icons for each category
- Colors and gradients
- Category-specific styling

**Usage:**
```typescript
import { categoryInfoMap } from '../utils/category-info';

const { icon: Icon, color, lightColor, gradient } = categoryInfoMap[category];
```

---

### `/frontend/src/utils/health-helpers.ts`

Health document-specific utilities.

**Available functions:**
- `getDocumentDate(doc: DocumentFile): Date | null` - Extract date from structured data
- `isOutOfRange(value, range): boolean` - Check if lab value is out of normal range
- `generateSnippet(text: string, maxLength): string` - Create preview text

**Usage:**
```typescript
import { getDocumentDate, isOutOfRange } from '../utils/health-helpers';

const docDate = getDocumentDate(document);
const isAbnormal = isOutOfRange(labResult.value, labResult.referenceRange);
```

---

## Services

### `/frontend/src/services/documentProcessor.ts`

Document management API client.

**Available functions:**
- `getDocuments(): Promise<{documents: DocumentFile[]}>` - List all documents
- `getDocument(id): Promise<DocumentFile>` - Get single document
- `uploadDocument(file, onProgress): Promise<DocumentFile>` - Upload new document
- `updateDocument(id, updates): Promise<DocumentFile>` - Update document
- `deleteDocument(id): Promise<void>` - Delete document

---

### `/frontend/src/services/chatService.ts`

AI chat API client.

**Available functions:**
- `sendChatMessage(message, history, sessionId): Promise<ChatResponse>` - Send chat message

---

### `/frontend/src/services/searchService.ts`

Universal search API client.

**Available functions:**
- `processUniversalSearch(query): Promise<UniversalSearchResult>` - Process search query

---

### `/frontend/src/services/userService.ts`

User profile API client.

**Available functions:**
- `updateUserProfile(uid, data): Promise<void>` - Update user profile

---

## Type Definitions

### `/frontend/src/types.ts`

Centralized TypeScript type definitions.

**Key types:**
- `DocumentFile` - Document data structure
- `DocumentCategory` - Union type for all categories
- `DocumentProcessingStatus` - 'processing' | 'pending_review' | 'reviewed'
- `ChatMessage` - Chat message structure
- `Theme` - 'light' | 'dark' | 'system'
- `View` - 'dashboard' | 'records' | 'settings' | 'search'
- `UniversalSearchResult` - Search result types

**Helper functions:**
- `getDocumentProcessingStatus(doc): DocumentProcessingStatus` - Determine document status

---

## Icons & Illustrations

### Icon Components (`/frontend/src/components/icons/`)

**Available icons (50+):**
- `UploadIcon`, `DownloadIcon`, `TrashIcon`, `PencilIcon`
- `CheckCircleIcon`, `XIcon`, `AlertCircleIcon`, `InfoIcon`
- `SearchIcon`, `FilterIcon`, `SortIcon`, `ChevronDownIcon`
- `SparklesIcon`, `ClockIcon`, `CalendarIcon`, `EyeIcon`
- `PaperAirplaneIcon`, `EllipsisVerticalIcon`, `ArrowLeftIcon`
- And more...

**Usage:**
```typescript
import { UploadIcon } from './icons/UploadIcon';

<UploadIcon className="w-5 h-5 text-teal-500" />
```

---

### Illustration Components (`/frontend/src/components/illustrations/`)

**Available illustrations:**
- `EmptyDashboard` - Empty state for dashboard
- `EmptyRecords` - Empty state for records view

**Usage:**
```typescript
import { EmptyDashboard } from './illustrations/EmptyDashboard';

<EmptyDashboard className="max-w-sm mx-auto" />
```

---

## Best Practices

### When Building New Features

1. **Check this document first** - Don't recreate what already exists
2. **Use shared constants** - Import from `config/constants.ts`
3. **Use shared messages** - Import from `config/messages.ts`
4. **Reuse common components** - Use `EditableInput`, `EditableTextArea`
5. **Leverage existing hooks** - Use `useToast`, `useClickOutside`, `useOnboarding`
6. **Follow patterns** - Look at existing components for styling consistency

### When Adding New Shared Code

1. **Add it to the appropriate directory**:
   - Constants → `/config/constants.ts`
   - Utilities → `/utils/`
   - Hooks → `/hooks/`
   - Common components → `/components/common/`

2. **Update this document** - Add the new resource with usage examples

3. **Use TypeScript** - Ensure proper typing for better DX

---

## Questions?

If you're unsure whether something already exists or where to add new shared code, check:
1. This document
2. The `/config`, `/hooks`, `/utils`, and `/components/common` directories
3. Ask the team!

---

**Remember:** The goal is to write code once and reuse it everywhere. Keep this document updated as we grow! 🚀
