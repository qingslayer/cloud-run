import React from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { InfoCircleIcon } from './icons/InfoCircleIcon';

interface EditableStructuredDataProps {
  data: Record<string, any>;
  setData: React.Dispatch<React.SetStateAction<any>>;
  category?: string;
}

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-base text-slate-800 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500 focus:outline-none ${props.className}`} />
);

const TextAreaField = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`w-full bg-white dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md p-2 text-base text-slate-800 dark:text-slate-200 focus:ring-sky-500 focus:border-sky-500 focus:outline-none resize-y min-h-[100px] ${props.className}`} />
);

const EditableStructuredData: React.FC<EditableStructuredDataProps> = ({ data, setData, category }) => {

    if (!data) return <p className="text-center text-sm text-slate-500 dark:text-slate-400">No data was extracted. Please add details manually.</p>;

    // Separate editable (simple) fields from complex ones
    const editableFields: [string, any][] = [];
    const complexFields: string[] = [];

    Object.entries(data).forEach(([key, value]) => {
        // Check if value is simple (string, number, boolean) or complex (object, array)
        if (value === null || value === undefined) {
            editableFields.push([key, '']);
        } else if (typeof value === 'object') {
            complexFields.push(key);
        } else {
            editableFields.push([key, value]);
        }
    });

    const handleChange = (oldKey: string, newKey: string, value: any) => {
        const newData = { ...data };
        if (oldKey !== newKey) {
            delete newData[oldKey];
        }
        newData[newKey] = value;
        setData(newData);
    };

    const handleValueChange = (key: string, value: any) => {
        setData({ ...data, [key]: value });
    };

    const addRow = () => {
        const newKey = `new_field_${Object.keys(data).length + 1}`;
        setData({ ...data, [newKey]: '' });
    };

    const deleteRow = (key: string) => {
        const newData = { ...data };
        delete newData[key];
        setData(newData);
    };

    // Special handling for Lab Results with complex data
    const hasComplexData = complexFields.length > 0;

    // Helper to determine if a field should use textarea
    const shouldUseTextarea = (key: string, value: any): boolean => {
        const stringValue = String(value);
        // Field names that typically contain long text
        const longTextFieldNames = ['findings', 'impression', 'instructions', 'notes', 'description', 'details', 'procedure', 'summary', 'comments'];
        const isLongTextField = longTextFieldNames.some(name => key.toLowerCase().includes(name));
        // Use textarea if field name suggests long text OR value is longer than 50 characters
        return isLongTextField || stringValue.length > 50;
    };

    return (
        <div className="space-y-4">
            {hasComplexData && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <InfoCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Complex data fields (like test results tables) cannot be edited directly. You can add notes below to supplement the information.
                        </p>
                    </div>
                </div>
            )}

            {editableFields.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Editable Fields</h4>
                    {editableFields.map(([key, value]) => {
                        const useTextarea = shouldUseTextarea(key, value);

                        return (
                            <div key={key} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <InputField
                                        placeholder="Field Name"
                                        value={key}
                                        onChange={(e) => handleChange(key, e.target.value, value)}
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={() => deleteRow(key)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md flex-shrink-0"
                                    >
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                {useTextarea ? (
                                    <TextAreaField
                                        placeholder="Value"
                                        value={String(value)}
                                        onChange={(e) => handleValueChange(key, e.target.value)}
                                    />
                                ) : (
                                    <InputField
                                        placeholder="Value"
                                        value={String(value)}
                                        onChange={(e) => handleValueChange(key, e.target.value)}
                                    />
                                )}
                            </div>
                        );
                    })}
                    <button onClick={addRow} className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors">
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Detail</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default EditableStructuredData;