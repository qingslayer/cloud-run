import React from 'react';
import { DocumentCategory } from '../types';
import { isOutOfRange } from '../utils/health-helpers';

interface StructuredDataDisplayProps {
  data: Record<string, any> | undefined;
  category: DocumentCategory;
}

// Lab Results Renderer - Table format with highlighting
const LabResultsRenderer: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  const results = data.results || [];

  if (!Array.isArray(results) || results.length === 0) {
    return <p className="text-sm text-center text-slate-400">No lab results available.</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Test Results</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Test Name</th>
              <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Value</th>
              <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Unit</th>
              <th className="text-left py-2 px-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Reference Range</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result: any, index: number) => {
              const outOfRange = isOutOfRange(result.value, result.referenceRange);
              return (
                <tr
                  key={index}
                  className={`border-b border-stone-100 dark:border-slate-800 ${
                    outOfRange ? 'bg-red-50 dark:bg-red-900/20' : index % 2 === 0 ? 'bg-stone-50 dark:bg-slate-800/30' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-sm font-medium text-slate-800 dark:text-slate-200">{result.testName}</td>
                  <td className={`py-3 px-3 text-sm font-bold ${outOfRange ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {result.value}
                  </td>
                  <td className="py-3 px-3 text-sm text-slate-600 dark:text-slate-400">{result.unit}</td>
                  <td className="py-3 px-3 text-sm text-slate-600 dark:text-slate-400">{result.referenceRange}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Prescriptions Renderer - Card-based list
const PrescriptionsRenderer: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  const prescriptions = data.prescriptions || [];

  if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
    return <p className="text-sm text-center text-slate-400">No prescriptions available.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Medications</h3>
      {prescriptions.map((rx: any, index: number) => (
        <div key={index} className="p-4 bg-stone-100 dark:bg-slate-800/50 rounded-lg border border-stone-200 dark:border-slate-700">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{rx.medication}</h4>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Dosage:</span> {rx.dosage}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Frequency:</span> {rx.frequency}
            </p>
            {rx.instructions && (
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Instructions:</span> {rx.instructions}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Imaging Reports Renderer - Sections with uppercase headers
const ImagingReportsRenderer: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {data.procedure && (
        <div>
          <h3 className="text-xs font-bold tracking-wider text-teal-600 dark:text-teal-400 mb-2">PROCEDURE</h3>
          <p className="text-base text-slate-800 dark:text-slate-200">{data.procedure}</p>
        </div>
      )}
      {data.findings && (
        <div>
          <h3 className="text-xs font-bold tracking-wider text-teal-600 dark:text-teal-400 mb-2">FINDINGS</h3>
          <p className="text-base text-slate-800 dark:text-slate-200">{data.findings}</p>
        </div>
      )}
      {data.impression && (
        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
          <h3 className="text-xs font-bold tracking-wider text-teal-600 dark:text-teal-400 mb-2">IMPRESSION</h3>
          <p className="text-base font-medium text-slate-800 dark:text-slate-200">{data.impression}</p>
        </div>
      )}
    </div>
  );
};

// Doctor's Notes / Generic Renderer - Flexible key-value display
const GenericRenderer: React.FC<{ data: Record<string, any> }> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-center text-slate-400">No structured data available.</p>;
  }

  // Check if this is an error response from the backend
  if (data.error && typeof data.error === 'string') {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Extraction Error</p>
        <p className="text-sm text-red-700 dark:text-red-300">{data.error}</p>
      </div>
    );
  }

  // Extract notes if present
  const { _notes, ...dataWithoutNotes } = data;

  return (
    <div className="space-y-6">
      {Object.entries(dataWithoutNotes).map(([key, value]) => (
        <div key={key}>
          <h3 className="text-xs font-bold tracking-wider text-teal-600 dark:text-teal-400 mb-2 uppercase">
            {key.replace(/_/g, ' ')}
          </h3>
          <div className="text-base text-slate-800 dark:text-slate-200">
            {Array.isArray(value) ? (
              <ul className="space-y-2">
                {value.map((item, index) => (
                  <li key={index} className="p-3 bg-stone-100 dark:bg-slate-800/50 rounded-lg">
                    {typeof item === 'object' && item !== null ? (
                      <div className="space-y-2">
                        {Object.entries(item).map(([itemKey, itemValue]) => (
                          <div key={itemKey}>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                              {itemKey.replace(/_/g, ' ')}
                            </span>
                            <span className="text-base text-slate-800 dark:text-slate-200">{String(itemValue)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-base">{String(item)}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : typeof value === 'object' && value !== null ? (
              <div className="space-y-4">
                {Object.entries(value).map(([subKey, subValue]) => (
                  <div key={subKey}>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                      {subKey.replace(/_/g, ' ')}
                    </span>
                    <p className="text-base text-slate-800 dark:text-slate-200">{String(subValue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base">{String(value)}</p>
            )}
          </div>
        </div>
      ))}

      {/* Display notes if present */}
      {_notes && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-400 mb-2 uppercase">Additional Notes</h3>
          <p className="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{_notes}</p>
        </div>
      )}
    </div>
  );
};

// Main component - Routes to category-specific renderers
const StructuredDataDisplay: React.FC<StructuredDataDisplayProps> = ({ data, category }) => {
  if (!data) {
    return <p className="text-sm text-center text-slate-400">No data available.</p>;
  }

  switch (category) {
    case 'Lab Results':
      return <LabResultsRenderer data={data} />;

    case 'Prescriptions':
      return <PrescriptionsRenderer data={data} />;

    case 'Imaging Reports':
      return <ImagingReportsRenderer data={data} />;

    case "Doctor's Notes":
    case 'Vaccination Records':
    case 'Other':
    default:
      return <GenericRenderer data={data} />;
  }
};

export default StructuredDataDisplay;
