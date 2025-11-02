import React from 'react';
import { DocumentCategory } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { PillIcon } from './icons/PillIcon';
import { isOutOfRange } from '../utils/health-helpers';
import { categoryInfoMap } from '../utils/category-info';

interface StructuredDataDisplayProps {
  data: any;
  category: DocumentCategory;
}

const SectionHeader: React.FC<{ category: DocumentCategory, title: string }> = ({ category, title }) => {
    const { color } = categoryInfoMap[category];
    return (
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${color}`}>{title}</h3>
    )
}

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center p-4 bg-red-100/60 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-lg">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{message}</p>
    </div>
);

const LabResultsDisplay: React.FC<{ data: any[] }> = ({ data }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-stone-100 dark:bg-slate-700/50 dark:text-slate-300">
                    <tr>
                        <th scope="col" className="px-4 py-3 rounded-l-lg">Test Name</th>
                        <th scope="col" className="px-4 py-3 text-center">Value</th>
                        <th scope="col" className="px-4 py-3">Reference Range</th>
                        <th scope="col" className="px-4 py-3 text-center rounded-r-lg">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((result, index) => {
                        const outOfRange = isOutOfRange(result.value, result.referenceRange);
                        return (
                            <tr key={index} className={`border-b border-stone-200 dark:border-slate-700/80 ${
                                outOfRange 
                                    ? 'bg-amber-100/50 dark:bg-amber-900/30' 
                                    : ''
                            }`}>
                                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{result.testName}</td>
                                <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                                    {result.value} {result.unit}
                                </td>
                                <td className="px-4 py-3 font-mono">{result.referenceRange}</td>
                                <td className="px-4 py-3 text-center">
                                    {outOfRange ? (
                                        <div className="flex items-center justify-center space-x-2 font-bold text-amber-600 dark:text-amber-400">
                                            <ExclamationTriangleIcon className="w-4 h-4" />
                                            <span>Flagged</span>
                                        </div>
                                    ) : (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" />
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

const PrescriptionDisplay: React.FC<{ data: any[] }> = ({ data }) => (
    <div className="space-y-4">
        {data.map((rx, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-stone-100/70 dark:bg-slate-700/50 rounded-2xl border border-stone-200 dark:border-slate-700">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white mt-1 shadow-md shadow-green-500/20">
                    <PillIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{rx.medication}</h4>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400">Dosage</p>
                            <p className="text-slate-700 dark:text-slate-300">{rx.dosage}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400">Frequency</p>
                            <p className="text-slate-700 dark:text-slate-300">{rx.frequency}</p>
                        </div>
                        {rx.instructions && (
                             <div className="sm:col-span-2">
                                <p className="font-semibold text-slate-500 dark:text-slate-400">Instructions</p>
                                <p className="text-slate-700 dark:text-slate-300">{rx.instructions}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
    </div>
);


const ImagingReportDisplay: React.FC<{ data: any }> = ({ data }) => (
    <div className="space-y-6 text-base leading-relaxed">
        {data.procedure && (
            <div>
                <SectionHeader category="Imaging Reports" title="Procedure" />
                <p className="text-slate-700 dark:text-slate-200">{data.procedure}</p>
            </div>
        )}
        {data.findings && (
            <div>
                <SectionHeader category="Imaging Reports" title="Findings" />
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{data.findings}</p>
            </div>
        )}
        {data.impression && (
            <div className="p-4 bg-teal-100/60 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-500/30 rounded-2xl">
                <SectionHeader category="Imaging Reports" title="Impression" />
                <p className="font-semibold text-teal-900 dark:text-teal-200 whitespace-pre-wrap">{data.impression}</p>
            </div>
        )}
    </div>
);


const DefaultDisplay: React.FC<{ data: any }> = ({ data }) => {
    const details = data.keyDetails || [];
    return (
        <ul className="space-y-3 text-base">
            {details.map((item: { key: string; value: string }, index: number) => (
                <li key={index} className="grid grid-cols-3 gap-2 p-2 rounded-lg even:bg-stone-100/70 dark:even:bg-slate-700/50">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 col-span-1">{item.key}:</span>
                    <span className="text-slate-700 dark:text-slate-200 col-span-2">{item.value}</span>
                </li>
            ))}
        </ul>
    );
}


const StructuredDataDisplay: React.FC<StructuredDataDisplayProps> = ({ data, category }) => {
    if (!data) {
        return <p className="text-sm text-center text-slate-400">No structured data available.</p>;
    }
    if (data.error) {
        return <ErrorDisplay message={data.error} />;
    }

    switch (category) {
        case 'Lab Results':
            return data.results ? <LabResultsDisplay data={data.results} /> : <ErrorDisplay message="Could not parse lab results." />;
        case 'Prescriptions':
            return data.prescriptions ? <PrescriptionDisplay data={data.prescriptions} /> : <ErrorDisplay message="Could not parse prescription details." />;
        case 'Imaging Reports':
            return data.findings || data.impression ? <ImagingReportDisplay data={data} /> : <ErrorDisplay message="Could not parse imaging report." />;
        default:
            return data.keyDetails ? <DefaultDisplay data={data} /> : <p className="text-sm text-center text-slate-400">No key details extracted for this category.</p>
    }
};

export default StructuredDataDisplay;