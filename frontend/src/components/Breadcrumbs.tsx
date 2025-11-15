import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium truncate max-w-[200px]"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
