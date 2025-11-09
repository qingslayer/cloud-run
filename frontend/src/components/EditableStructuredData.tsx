import React from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface EditableStructuredDataProps {
  data: Record<string, any>;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-base text-slate-200 focus:ring-sky-500 focus:border-sky-500 focus:outline-none ${props.className}`} />
);

const EditableStructuredData: React.FC<EditableStructuredDataProps> = ({ data, setData }) => {
    if (!data) return <p className="text-center text-sm text-slate-500">No data was extracted. Please add details manually.</p>;

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

    return (
        <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                    <InputField placeholder="Key" value={key} onChange={(e) => handleChange(key, e.target.value, value)} />
                    <InputField placeholder="Value" value={String(value)} onChange={(e) => handleValueChange(key, e.target.value)} />
                    <button onClick={() => deleteRow(key)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                </div>
            ))}
            <button onClick={addRow} className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span>Add Detail</span>
            </button>
        </div>
    );
};

export default EditableStructuredData;