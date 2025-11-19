# Frontend Architecture

**Last Updated:** 2025-01-19

This document provides technical details about the HealthVault frontend architecture, code organization, and development patterns.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [State Management](#state-management)
- [Routing & Navigation](#routing--navigation)
- [Styling Approach](#styling-approach)
- [Component Patterns](#component-patterns)
- [Development Workflow](#development-workflow)

---

## Technology Stack

**Core:**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server

**Styling:**
- **TailwindCSS** - Utility-first CSS
- **Dark Mode** - System/manual theme switching

**Authentication:**
- **Firebase Auth** - User authentication

**State Management:**
- **React Hooks** - Local state (`useState`, `useEffect`, etc.)
- **Custom Hooks** - Shared logic (`useToast`, `useOnboarding`, `useClickOutside`)
- **Context** - Minimal usage (toast system)

---

## Project Structure

```
frontend/src/
├── components/              # UI components
│   ├── common/             # Reusable components
│   │   ├── EditableInput.tsx
│   │   └── EditableTextArea.tsx
│   ├── icons/              # Icon components (50+)
│   ├── illustrations/      # SVG illustrations
│   ├── Dashboard.tsx       # Main dashboard view
│   ├── Records.tsx         # Document list view
│   ├── DocumentDetailView.tsx
│   ├── DocumentCard.tsx
│   ├── EditableStructuredData.tsx
│   ├── EditableLabResults.tsx
│   ├── EditablePrescriptions.tsx
│   ├── ChatPanel.tsx
│   ├── TopCommandBar.tsx
│   ├── Toast.tsx
│   └── ... (90+ components)
│
├── config/                 # Configuration files
│   ├── constants.ts        # Centralized constants
│   ├── messages.ts         # UI messages & errors
│   ├── api.ts             # API configuration
│   └── firebase.ts        # Firebase configuration
│
├── hooks/                  # Custom React hooks
│   ├── useToast.ts        # Toast notifications
│   ├── useOnboarding.ts   # Onboarding state
│   └── useClickOutside.ts # Click-outside detection
│
├── services/               # Backend API clients
│   ├── documentProcessor.ts
│   ├── chatService.ts
│   ├── searchService.ts
│   └── userService.ts
│
├── utils/                  # Utility functions
│   ├── formatters.ts      # Text/date/file formatting
│   ├── category-info.ts   # Category metadata
│   └── health-helpers.ts  # Health-specific utilities
│
├── types.ts               # TypeScript type definitions
├── App.tsx                # Main application component
└── main.tsx              # Application entry point
```

---

## State Management

### Application-Level State (App.tsx)

The `App` component manages global application state:

**User State:**
- `currentUser` - Authenticated user
- `isAuthLoading` - Auth initialization status

**Document State:**
- `documents` - All user documents
- `isDocumentsLoading` - Loading status
- `selectedDocumentId` - Currently viewed document
- `selectedDocumentData` - Full document data
- `viewedDocuments` - Set of viewed document IDs

**UI State:**
- `view` - Current view ('dashboard' | 'records' | 'settings' | 'search')
- `theme` - Theme preference
- `isRightPanelOpen` - Chat panel state
- `deleteConfirmation` - Deletion modal state
- `reviewModalDocument` - Document pending review

**Search & Chat State:**
- `searchQuery` - Current search query
- `pageSearchResults` - Search results
- `chatMessages` - Chat history
- `chatSessionId` - Chat session ID

### Component-Level State

Components manage their own local state:
- Form inputs
- Dropdown/menu open states
- Edit mode toggles
- Loading states

### Shared State (Hooks)

Custom hooks provide shared stateful logic:
- `useToast()` - Toast notification state
- `useOnboarding()` - Onboarding progress state
- `useClickOutside()` - Outside click detection

---

## Routing & Navigation

**Note:** This app uses **view-based navigation** (not React Router).

Navigation is controlled by the `view` state in `App.tsx`:
- `dashboard` - Home view with categories and recent documents
- `records` - Full document list with filtering and sorting
- `settings` - User settings and preferences
- `search` - Search results page

**View Changes:**
```typescript
setView('dashboard');  // Navigate to dashboard
setView('records');    // Navigate to records
```

**Document Detail View:**
- Overlays current view
- Managed by `selectedDocumentId` state
- Keyboard navigation (arrow keys, ESC)

---

## Styling Approach

### TailwindCSS

All styling uses Tailwind utility classes:

**Example:**
```tsx
<button className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600
  dark:bg-teal-600 dark:hover:bg-teal-700 transition-colors">
  Click Me
</button>
```

### Dark Mode

Dark mode is supported throughout using Tailwind's `dark:` prefix:
- Theme stored in localStorage
- Three modes: 'light', 'dark', 'system'
- Automatically applies based on system preference in 'system' mode

**Usage:**
```tsx
<div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
  Content
</div>
```

### Component Styling Patterns

**Consistent patterns used throughout:**
- Buttons: `rounded-lg`, `transition-colors`, `focus-visible:` states
- Inputs: See `EditableInput` component for standard input styling
- Cards: `rounded-2xl`, `shadow-sm`, gradient backgrounds for categories
- Modals: `backdrop-blur-sm`, `fixed inset-0`, centered positioning

---

## Component Patterns

### Feature Component Pattern

Large feature components follow this structure:

```typescript
import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';

interface MyComponentProps {
  // Props interface
}

const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // 1. Hooks
  const { success, error } = useToast();
  const [state, setState] = useState();

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // 3. Event handlers
  const handleAction = () => {
    // Handler logic
  };

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### Reusable Component Pattern

Small reusable components are kept simple:

```typescript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg ${variant === 'primary' ? 'bg-teal-500' : 'bg-slate-500'}`}
    >
      {children}
    </button>
  );
};
```

### Icon Component Pattern

Icons are individual components for tree-shaking:

```typescript
export const UploadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} /* ... */ >
    {/* SVG path */}
  </svg>
);
```

---

## Development Workflow

### Adding a New Feature

1. **Check existing code** - Review [SHARED_RESOURCES.md](./SHARED_RESOURCES.md)
2. **Use shared components** - Import from `/components/common`
3. **Use shared hooks** - Import from `/hooks`
4. **Use constants** - Import from `/config/constants.ts`
5. **Follow patterns** - Match existing component structure
6. **Type everything** - Use TypeScript interfaces

### Creating New Shared Resources

**When to create shared code:**
- Same code appears in 3+ places
- Functionality will likely be reused
- Styling patterns are repeated
- Complex logic that should be tested

**Where to put it:**
- Utilities → `/utils/`
- Hooks → `/hooks/`
- Components → `/components/common/`
- Constants → `/config/constants.ts`
- Types → `/types.ts`

**Remember to update** [SHARED_RESOURCES.md](./SHARED_RESOURCES.md)!

### Code Style

**TypeScript:**
- Use interfaces for props
- Export types from `/types.ts`
- Avoid `any` - use proper typing

**React:**
- Functional components with hooks
- Props destructuring
- Clear prop interfaces
- Meaningful component names

**Naming Conventions:**
- Components: `PascalCase` (`DocumentCard`)
- Files: `PascalCase.tsx` (`DocumentCard.tsx`)
- Hooks: `use` prefix (`useToast`)
- Utils: `camelCase` (`formatRelativeTime`)
- Constants: `UPPER_SNAKE_CASE` (`STORAGE_KEYS`)

---

## Key Features

### Drag & Drop

Drag & drop is restricted to specific areas:
- ✅ Category tiles (Dashboard)
- ✅ Upload button (TopCommandBar)
- ✅ Upload modal box
- ✅ Chat panel (for future file attachments)

**Implementation:**
- Uses native HTML5 drag events
- Visual feedback on drag over
- Triggers global upload dialog

### Document Processing Flow

1. User uploads document
2. Document stored in Cloud Storage
3. Metadata saved to Firestore
4. AI analysis triggered (async)
5. Polling checks for completion
6. Review modal shown when ready
7. User reviews/approves
8. Document marked as reviewed

### Onboarding System

Progressive onboarding guides new users:
- Welcome modal on first visit
- Tooltips for key features
- State persisted to localStorage
- Can be reset in settings

### Toast Notifications

Centralized notification system:
- 4 types: success, error, warning, info
- Auto-dismiss with configurable duration
- Multiple simultaneous toasts
- Accessible with ARIA labels

---

## Performance Considerations

**Optimizations in place:**
- Lazy polling (only when documents are processing)
- Memoized expensive calculations (`useMemo`)
- Callback memoization (`useCallback`)
- Document grouping cached
- Efficient re-renders (proper dependency arrays)

**Best practices:**
- Keep components small and focused
- Extract expensive logic to utilities
- Use keys properly in lists
- Avoid inline function creation in render
- Debounce user input when needed

---

## Accessibility

**Current support:**
- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation (ESC, arrow keys, Cmd+K)
- Focus management in modals
- Color contrast compliance

**Areas for improvement:**
- Add more ARIA roles
- Improve screen reader support
- Add live regions for dynamic content
- Better keyboard navigation

---

## Testing

**Current state:**
- No automated tests yet

**Recommended testing approach:**
- **Unit tests:** Utilities, helpers, formatters
- **Component tests:** Common components, hooks
- **Integration tests:** Key user flows (upload, review, search)
- **E2E tests:** Critical paths

**Tools to consider:**
- Vitest (unit/component tests)
- React Testing Library (component tests)
- Playwright or Cypress (E2E tests)

---

## Deployment

The frontend is built and deployed separately from the backend:

**Build:**
```bash
npm run build
```

**Output:**
- Static files in `/dist`
- Optimized and minified
- Ready for CDN deployment

**Environment Variables:**
- `VITE_API_URL` - Backend API URL
- Firebase config (public keys)

---

## Future Improvements

**Potential enhancements:**
- Extract EditableTable generic component
- Split large components (DocumentDetailView, Records)
- Add React Router for better URL management
- Implement virtual scrolling for large lists
- Add comprehensive test coverage
- Improve accessibility
- Add i18n support
- Optimize bundle size

---

## Questions?

For implementation details on specific features, see:
- [SHARED_RESOURCES.md](./SHARED_RESOURCES.md) - Catalog of reusable code
- [Main README](../README.md) - Setup and getting started
- Component source code - Inline comments and JSDoc

---

**Remember:** Keep this document updated as the architecture evolves! 📚
