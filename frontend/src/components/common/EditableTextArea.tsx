import React from 'react';

interface EditableTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * Reusable textarea component with consistent styling across editable forms
 * Used in EditableStructuredData and other form components
 */
const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full bg-white dark:bg-slate-700 border-0 p-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-sky-500 rounded resize-y ${className}`}
    />
  );
};

export default EditableTextArea;
