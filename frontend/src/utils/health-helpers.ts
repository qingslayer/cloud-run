import { DocumentFile } from '../types';

/**
 * Extract the document date from AI-analyzed structured data.
 * Returns null if no document date is found (doesn't fall back to upload date).
 * Common field names: date, test_date, report_date, exam_date, service_date, prescription_date
 */
export const getDocumentDate = (document: DocumentFile): Date | null => {
  if (!document.aiAnalysis?.structuredData) {
    return null;
  }

  const data = document.aiAnalysis.structuredData;

  // Common date field names in structured data
  const dateFieldNames = [
    'date',
    'test_date',
    'testDate',
    'report_date',
    'reportDate',
    'exam_date',
    'examDate',
    'service_date',
    'serviceDate',
    'prescription_date',
    'prescriptionDate',
    'visit_date',
    'visitDate',
    'collection_date',
    'collectionDate'
  ];

  // Try to find a date field
  for (const fieldName of dateFieldNames) {
    const dateValue = data[fieldName];
    if (dateValue) {
      try {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch (e) {
        // Continue to next field
      }
    }
  }

  // Return null if no valid date found
  return null;
};

export const isOutOfRange = (valueStr: string, rangeStr: string): boolean => {
    try {
        if (!valueStr || !rangeStr) return false;
        const value = parseFloat(valueStr);
        if (isNaN(value)) return false;
        const [min, max] = rangeStr.match(/[\d.]+/g)?.map(parseFloat) || [null, null];
        if (min !== null && max !== null) {
            return value < min || value > max;
        }
    } catch (e) {
        return false;
    }
    return false;
};

export const generateSnippet = (document: DocumentFile): string | null => {
    if (document.status !== 'complete' || !document.aiAnalysis?.structuredData) return null;

    try {
        switch (document.category) {
            case 'Lab Results':
                const results = document.aiAnalysis.structuredData.results || [];
                const flaggedCount = results.filter((r: any) => isOutOfRange(r.value, r.referenceRange)).length;
                return flaggedCount > 0 ? `${flaggedCount} value${flaggedCount > 1 ? 's' : ''} flagged` : 'All values within range';
            
            case 'Prescriptions':
                const prescriptions = document.aiAnalysis.structuredData.prescriptions || [];
                if (prescriptions.length > 0) {
                    const firstRx = prescriptions[0];
                    return `${firstRx.medication} - ${firstRx.dosage}`;
                }
                return 'No prescriptions found.';

            case 'Imaging Reports':
                return document.aiAnalysis.structuredData.impression ? `Impression: ${document.aiAnalysis.structuredData.impression}` : 'No impression found.';
            
            default:
                if (document.aiAnalysis.searchSummary) {
                    return document.aiAnalysis.searchSummary.substring(0, 100).replace(/\s+/g, ' ') + '...';
                }
                return null;
        }
    } catch (error) {
        console.error("Error generating snippet:", error);
        return "Could not generate snippet.";
    }
};