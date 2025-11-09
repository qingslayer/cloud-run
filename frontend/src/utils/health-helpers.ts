import { DocumentFile } from '../types';

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
                if (document.aiAnalysis.extractedText) {
                    return document.aiAnalysis.extractedText.substring(0, 100).replace(/\s+/g, ' ') + '...';
                }
                return null;
        }
    } catch (error) {
        console.error("Error generating snippet:", error);
        return "Could not generate snippet.";
    }
};