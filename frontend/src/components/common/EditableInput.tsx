import React from 'react';

interface EditableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  className?: string;
}

/**
 * Reusable input component with consistent styling across editable forms
 * Used in EditableLabResults, EditablePrescriptions, and EditableStructuredData
 */
const EditableInput: React.FC<EditableInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white dark:bg-slate-700 border-0 p-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-sky-500 rounded ${className}`}
    />
  );
};

export default EditableInput;
