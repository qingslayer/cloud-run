import React from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import EditableInput from './common/EditableInput';

interface LabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
}

interface EditableLabResultsProps {
  results: LabResult[];
  onChange: (results: LabResult[]) => void;
}

const EditableLabResults: React.FC<EditableLabResultsProps> = ({ results, onChange }) => {
  const handleResultChange = (index: number, field: keyof LabResult, value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    onChange(newResults);
  };

  const addResult = () => {
    onChange([...results, { testName: '', value: '', unit: '', referenceRange: '' }]);
  };

  const deleteResult = (index: number) => {
    onChange(results.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Test Name</th>
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Value</th>
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Unit</th>
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Reference Range</th>
              <th className="w-10 border border-slate-300 dark:border-slate-600"></th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={result.testName}
                    onChange={(value) => handleResultChange(index, 'testName', value)}
                    placeholder="Test name"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={result.value}
                    onChange={(value) => handleResultChange(index, 'value', value)}
                    placeholder="Value"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={result.unit}
                    onChange={(value) => handleResultChange(index, 'unit', value)}
                    placeholder="Unit"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={result.referenceRange}
                    onChange={(value) => handleResultChange(index, 'referenceRange', value)}
                    placeholder="Range"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600 text-center">
                  <button
                    onClick={() => deleteResult(index)}
                    className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded"
                    aria-label="Delete result"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={addResult}
        className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        <span>Add Test Result</span>
      </button>
    </div>
  );
};

export default EditableLabResults;