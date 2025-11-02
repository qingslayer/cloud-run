import { DocumentFile, DocumentCategory } from '../types';

const QUESTION_WORDS = ['what', 'who', 'when', 'where', 'why', 'how', 'is', 'are', 'can', 'do', 'does', 'show me'];
const INTERPRETATION_KEYWORDS = ['results', 'summary', 'details', 'values', 'normal', 'meaning', 'findings', 'impression'];

export const shouldUseAI = (query: string): boolean => {
    const lowerCaseQuery = query.toLowerCase().trim();

    if (lowerCaseQuery.endsWith('?')) return true;

    const words = lowerCaseQuery.split(' ');
    if (QUESTION_WORDS.includes(words[0])) return true;

    if (INTERPRETATION_KEYWORDS.some(keyword => lowerCaseQuery.includes(keyword))) return true;

    if (words.some(word => word.length > 2 && word === word.toUpperCase())) return true;

    return false;
};

const parseDateFilter = (query: string): ((date: Date) => boolean) | null => {
    const now = new Date();
    const queryDate = new Date();
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('recent')) {
        const ninetyDaysAgo = new Date(queryDate.setDate(queryDate.getDate() - 90));
        return (date) => date > ninetyDaysAgo;
    }
    if (lowerQuery.includes('last year')) {
        const lastYear = now.getFullYear() - 1;
        return (date) => date.getFullYear() === lastYear;
    }
    const yearMatch = lowerQuery.match(/\b(20\d{2})\b/);
    if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        if (lowerQuery.includes(`from ${year}`)) {
            return (date) => date.getFullYear() >= year;
        }
        return (date) => date.getFullYear() === year;
    }
    const monthsMatch = lowerQuery.match(/last (\d+) months/);
    if (monthsMatch) {
        const months = parseInt(monthsMatch[1], 10);
        const targetDate = new Date(queryDate.setMonth(queryDate.getMonth() - months));
        return (date) => date > targetDate;
    }

    return null;
};

const CATEGORIES: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];

const SYNONYM_MAP: { [key: string]: string[] } = {
    "blood work": ["complete blood count", "cbc", "blood test", "hemogram"],
    "blood test": ["complete blood count", "cbc", "blood work", "hemogram"],
    "cholesterol": ["lipid panel", "cholesterol test", "lipids", "ldl", "hdl"],
    "xray": ["x-ray", "radiograph", "imaging report", "radiology"],
    "mri": ["magnetic resonance imaging", "mri scan", "imaging"],
    "ct scan": ["computed tomography", "cat scan", "ct", "imaging"],
    "prescription": ["medication", "meds", "rx", "drug", "drugs", "medicine"],
    "checkup": ["physical", "exam", "doctor visit", "annual", "appointment"],
};

export const filterDocuments = (query: string, documents: DocumentFile[]): DocumentFile[] => {
    const lowerQuery = query.toLowerCase();
    
    let queryForKeywords = lowerQuery;

    const dateFilter = parseDateFilter(lowerQuery);
    if (dateFilter) {
      queryForKeywords = queryForKeywords
        .replace(/recent|last year|from \d{4}|last \d+ months|\b(20\d{2})\b/g, '')
        .trim();
    }
    
    let categoryFilter: DocumentCategory | null = null;
    for (const cat of CATEGORIES) {
        const lowerCat = cat.toLowerCase();
        if (queryForKeywords.includes(lowerCat)) {
            categoryFilter = cat;
            queryForKeywords = queryForKeywords.replace(lowerCat, '').trim();
            break;
        }
    }
    
    const searchCriteria: string[][] = [];
    let remainingQuery = queryForKeywords;

    const sortedSynonymKeys = Object.keys(SYNONYM_MAP).sort((a, b) => b.length - a.length);

    sortedSynonymKeys.forEach(key => {
        if (remainingQuery.includes(key)) {
            searchCriteria.push([key, ...SYNONYM_MAP[key]]);
            remainingQuery = remainingQuery.replace(new RegExp(key, 'g'), ' ');
        }
    });

    const remainingKeywords = remainingQuery.trim().split(' ').filter(kw => kw.length > 0);
    remainingKeywords.forEach(kw => {
        searchCriteria.push([kw]);
    });

    return documents.filter(doc => {
        if (dateFilter && !dateFilter(doc.uploadDate)) {
            return false;
        }
        if (categoryFilter && doc.category !== categoryFilter) {
            return false;
        }

        if (searchCriteria.length > 0) {
            const searchableText = [
                doc.title.toLowerCase(),
                doc.category.toLowerCase(),
                doc.userNotes?.toLowerCase() || '',
                JSON.stringify(doc.structuredData).toLowerCase(),
            ].join(' ');
            
            const matchesAllCriteria = searchCriteria.every(group => 
                group.some(term => searchableText.includes(term))
            );

            if (!matchesAllCriteria) {
                return false;
            }
        }
        
        return true;
    });
};