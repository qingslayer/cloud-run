import React from 'react';
import { DocumentCategory } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface EditableStructuredDataProps {
  category: DocumentCategory;
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-base text-slate-200 focus:ring-sky-500 focus:border-sky-500 focus:outline-none ${props.className}`} />
);

const TextAreaField = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`w-full bg-slate-700/50 border border-slate-600 rounded-md p-2 text-base text-slate-200 focus:ring-sky-500 focus:border-sky-500 focus:outline-none ${props.className}`} />
);

// --- Lab Results Editor ---

const EditableLabResultsDisplay: React.FC<{ data: any[], setData: (data: any) => void }> = ({ data, setData }) => {
    const handleLabChange = (index: number, field: string, value: string) => {
        const updatedResults = [...data];
        updatedResults[index] = { ...updatedResults[index], [field]: value };
        setData({ results: updatedResults });
    };

    const addRow = () => {
        setData({ results: [...data, { testName: '', value: '', unit: '', referenceRange: '' }] });
    };

    const deleteRow = (index: number) => {
        setData({ results: data.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-2">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-slate-400 font-semibold uppercase"><th className="p-1.5">Test</th><th className="p-1.5">Value</th><th className="p-1.5">Unit</th><th className="p-1.5">Range</th><th className="w-12"></th></tr></thead>
                    <tbody>
                        {data.map((res, i) => (
                            <tr key={i} className="align-top">
                                <td className="p-1"><InputField value={res.testName} onChange={(e) => handleLabChange(i, 'testName', e.target.value)} /></td>
                                <td className="p-1"><InputField value={res.value} onChange={(e) => handleLabChange(i, 'value', e.target.value)} /></td>
                                <td className="p-1"><InputField value={res.unit} onChange={(e) => handleLabChange(i, 'unit', e.target.value)} /></td>
                                <td className="p-1"><InputField value={res.referenceRange} onChange={(e) => handleLabChange(i, 'referenceRange', e.target.value)} /></td>
                                <td className="p-1"><button onClick={() => deleteRow(i)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-5 h-5"/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button onClick={addRow} className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span>Add Row</span>
            </button>
        </div>
    );
};


// --- Prescriptions Editor ---

const EditablePrescriptionsDisplay: React.FC<{ data: any[], setData: (data: any) => void }> = ({ data, setData }) => {
    const handleRxChange = (index: number, field: string, value: string) => {
        const updatedPrescriptions = [...data];
        updatedPrescriptions[index] = { ...updatedPrescriptions[index], [field]: value };
        setData({ prescriptions: updatedPrescriptions });
    };

    const addRx = () => {
        setData({ prescriptions: [...data, { medication: '', dosage: '', frequency: '', instructions: '' }] });
    };

    const deleteRx = (index: number) => {
        setData({ prescriptions: data.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            {data.map((rx, i) => (
                <div key={i} className="relative p-4 bg-slate-800/50 rounded-xl space-y-3 border border-white/10">
                    <button onClick={() => deleteRx(i)} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-4 h-4"/></button>
                    <div>
                        <label className="text-xs font-semibold text-slate-400">Medication</label>
                        <InputField value={rx.medication} onChange={(e) => handleRxChange(i, 'medication', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-400">Dosage</label>
                            <InputField value={rx.dosage} onChange={(e) => handleRxChange(i, 'dosage', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400">Frequency</label>
                            <InputField value={rx.frequency} onChange={(e) => handleRxChange(i, 'frequency', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-400">Instructions</label>
                        <TextAreaField value={rx.instructions} onChange={(e) => handleRxChange(i, 'instructions', e.target.value)} rows={2} />
                    </div>
                </div>
            ))}
            <button onClick={addRx} className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span>Add Prescription</span>
            </button>
        </div>
    );
};

// --- Imaging Report Editor ---

const EditableImagingReportDisplay: React.FC<{ data: any, setData: (data: any) => void }> = ({ data, setData }) => {
    const handleChange = (field: string, value: string) => {
        setData({ ...data, [field]: value });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-semibold text-slate-400 mb-1 block">Procedure</label>
                <InputField value={data.procedure || ''} onChange={(e) => handleChange('procedure', e.target.value)} />
            </div>
            <div>
                <label className="text-sm font-semibold text-slate-400 mb-1 block">Findings</label>
                <TextAreaField value={data.findings || ''} onChange={(e) => handleChange('findings', e.target.value)} rows={6} />
            </div>
            <div>
                <label className="text-sm font-semibold text-slate-400 mb-1 block">Impression</label>
                <TextAreaField value={data.impression || ''} onChange={(e) => handleChange('impression', e.target.value)} rows={4} />
            </div>
        </div>
    );
};

// --- Default Key-Value Editor ---

const EditableDefaultDisplay: React.FC<{ data: any, setData: (data: any) => void }> = ({ data, setData }) => {
    const keyDetails = data.keyDetails || [];

    const handleChange = (index: number, field: 'key' | 'value', value: string) => {
        const updatedDetails = [...keyDetails];
        updatedDetails[index] = { ...updatedDetails[index], [field]: value };
        setData({ keyDetails: updatedDetails });
    };

    const addRow = () => {
        setData({ keyDetails: [...keyDetails, { key: '', value: '' }] });
    };

    const deleteRow = (index: number) => {
        setData({ keyDetails: keyDetails.filter((_: any, i: number) => i !== index) });
    };

    return (
        <div className="space-y-2">
            {keyDetails.map((item: {key: string, value: string}, index: number) => (
                <div key={index} className="flex items-center gap-2">
                    <InputField placeholder="Key" value={item.key} onChange={(e) => handleChange(index, 'key', e.target.value)} />
                    <InputField placeholder="Value" value={item.value} onChange={(e) => handleChange(index, 'value', e.target.value)} />
                    <button onClick={() => deleteRow(index)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-5 h-5"/></button>
                </div>
            ))}
            <button onClick={addRow} className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span>Add Detail</span>
            </button>
        </div>
    );
};

// --- Main Component ---

const EditableStructuredData: React.FC<EditableStructuredDataProps> = ({ category, data, setData }) => {
    if (!data) return <p className="text-center text-sm text-slate-500">No data was extracted. Please add details manually.</p>;

    switch (category) {
        case 'Lab Results':
            return <EditableLabResultsDisplay data={data.results || []} setData={(d) => setData(d)} />;
        case 'Prescriptions':
            return <EditablePrescriptionsDisplay data={data.prescriptions || []} setData={(d) => setData(d)} />;
        case 'Imaging Reports':
            return <EditableImagingReportDisplay data={data} setData={setData} />;
        default:
            return <EditableDefaultDisplay data={data} setData={setData} />;
    }
};

export default EditableStructuredData;