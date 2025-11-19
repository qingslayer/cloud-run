import React from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import EditableInput from './common/EditableInput';

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  instructions?: string;
}

interface EditablePrescriptionsProps {
  prescriptions: Prescription[];
  onChange: (prescriptions: Prescription[]) => void;
}

const EditablePrescriptions: React.FC<EditablePrescriptionsProps> = ({ prescriptions, onChange }) => {
  const handlePrescriptionChange = (index: number, field: keyof Prescription, value: string) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index] = { ...newPrescriptions[index], [field]: value };
    onChange(newPrescriptions);
  };

  const addPrescription = () => {
    onChange([...prescriptions, { medication: '', dosage: '', frequency: '', instructions: '' }]);
  };

  const deletePrescription = (index: number) => {
    onChange(prescriptions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Medication</th>
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Dosage</th>
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Frequency</th>
              <th className="text-left p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">Instructions</th>
              <th className="w-10 border border-slate-300 dark:border-slate-600"></th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((prescription, index) => (
              <tr key={index}>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={prescription.medication}
                    onChange={(value) => handlePrescriptionChange(index, 'medication', value)}
                    placeholder="Medication name"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={prescription.dosage}
                    onChange={(value) => handlePrescriptionChange(index, 'dosage', value)}
                    placeholder="e.g., 10mg"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={prescription.frequency}
                    onChange={(value) => handlePrescriptionChange(index, 'frequency', value)}
                    placeholder="e.g., Twice daily"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600">
                  <EditableInput
                    value={prescription.instructions || ''}
                    onChange={(value) => handlePrescriptionChange(index, 'instructions', value)}
                    placeholder="Special instructions"
                  />
                </td>
                <td className="p-1 border border-slate-300 dark:border-slate-600 text-center">
                  <button
                    onClick={() => deletePrescription(index)}
                    className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded"
                    aria-label="Delete prescription"
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
        onClick={addPrescription}
        className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        <span>Add Prescription</span>
      </button>
    </div>
  );
};

export default EditablePrescriptions;