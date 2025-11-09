import React from 'react';
import { DocumentCategory } from '../types';

interface StructuredDataDisplayProps {
  data: Record<string, any>;
  category: DocumentCategory;
}

const StructuredDataDisplay: React.FC<StructuredDataDisplayProps> = ({ data, category }) => {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-center text-slate-400">No structured data available.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize">{key.replace(/_/g, ' ')}</h4>
          <div className="mt-1 text-base text-slate-800 dark:text-slate-200">
            {Array.isArray(value) ? (
              <ul className="space-y-2">
                {value.map((item, index) => (
                  <li key={index} className="p-2 bg-stone-100 dark:bg-slate-800/50 rounded-lg">
                    {typeof item === 'object' ? (
                      <div className="space-y-1">
                        {Object.entries(item).map(([itemKey, itemValue]) => (
                          <div key={itemKey} className="grid grid-cols-2 gap-2">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{itemKey.replace(/_/g, ' ')}:</span>
                            <span>{String(itemValue)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      String(item)
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{String(value)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StructuredDataDisplay;