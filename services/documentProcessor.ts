import { Type } from '@google/genai';
import { DocumentFile, DocumentCategory } from '../types';
import { ai, model } from './ai';

export const analyzeAndCategorizeDocument = async (text: string): Promise<{ title: string, category: DocumentCategory }> => {
    const categories: DocumentCategory[] = ['Lab Results', 'Prescriptions', 'Imaging Reports', "Doctor's Notes", 'Vaccination Records', 'Other'];
    
    const prompt = `Analyze the following medical document text. Based on its content, provide a concise, human-readable title and determine the most appropriate category from the provided list.

Categories: ${categories.join(', ')}

--- DOCUMENT TEXT ---
${text.substring(0, 4000)}
--- END DOCUMENT TEXT ---

Respond with a JSON object containing "title" and "category". The title should be descriptive and include relevant dates if found (e.g., "Complete Blood Count - Mar 15, 2024"). The category must be one of the exact strings from the list provided.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING, enum: categories }
                    },
                    required: ['title', 'category']
                }
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error('Gemini analysis/categorization failed:', error);
        return {
            title: 'Untitled Document',
            category: 'Other'
        };
    }
};

export const extractTextFromDocument = async (file: Pick<DocumentFile, 'base64Data' | 'type'>): Promise<string> => {
  if (!file.base64Data) {
    return 'File data is not available for text extraction.';
  }
  
  const generativePart = {
    inlineData: {
      data: file.base64Data.split(',')[1],
      mimeType: file.type,
    },
  };
  
  const prompt = "Extract and return all text content from the provided document. If it is an image, perform OCR. Be as accurate as possible. Only return the extracted text, with no additional commentary or formatting.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [generativePart, { text: prompt }] },
    });
    return response.text;
  } catch (error) {
    console.error('Gemini text extraction failed:', error);
    return 'Could not extract text from this document.';
  }
};

const getResponseSchemaForCategory = (category: DocumentCategory) => {
    switch (category) {
        case 'Lab Results':
            return {
                type: Type.OBJECT,
                properties: {
                    results: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                testName: { type: Type.STRING },
                                value: { type: Type.STRING },
                                unit: { type: Type.STRING },
                                referenceRange: { type: Type.STRING },
                            },
                            required: ['testName', 'value', 'unit', 'referenceRange']
                        }
                    }
                }
            };
        case 'Prescriptions':
            return {
                type: Type.OBJECT,
                properties: {
                    prescriptions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                medication: { type: Type.STRING },
                                dosage: { type: Type.STRING },
                                frequency: { type: Type.STRING },
                                instructions: { type: Type.STRING },
                            },
                            required: ['medication', 'dosage', 'frequency']
                        }
                    }
                }
            };
        case 'Imaging Reports':
            return {
                type: Type.OBJECT,
                properties: {
                    procedure: { type: Type.STRING },
                    findings: { type: Type.STRING },
                    impression: { type: Type.STRING },
                },
                required: ['procedure', 'findings', 'impression']
            };
        default:
            return {
                type: Type.OBJECT,
                properties: {
                    keyDetails: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                key: { type: Type.STRING },
                                value: { type: Type.STRING },
                            },
                            required: ['key', 'value']
                        }
                    }
                }
            };
    }
}


export const extractStructuredData = async (document: DocumentFile): Promise<any> => {
    if (!document.extractedText) {
        return { error: 'No text available to parse.' };
    }

    const schema = getResponseSchemaForCategory(document.category);

    const prompt = `You are an expert medical data extraction specialist. Your task is to parse the provided medical document text and extract ALL clinically relevant information into a structured JSON object.

**Document Type:** "${document.category}"

**Guiding Principle:** If it helps a patient or doctor understand the medical record, extract it. If it's purely administrative or logistical information (other than provider/doctor names), skip it.

**Extraction Rules:**

1.  **BE COMPREHENSIVE WITH CLINICAL DATA:** Extract ALL available medical details. Do not summarize or pick and choose. For example, if there are multiple test results or medications, extract every single one.
    - **Medical Dates:** The date the test, procedure, or consultation occurred.
    - **Providers/Doctors:** The names of attending physicians or specialists mentioned.
    - **Diagnoses and Findings:** All specific medical conditions, observations, or results.
    - **Test Results & Values:** For lab reports, capture every test name, its corresponding value, units, and reference range.
    - **Medications & Instructions:** For prescriptions, capture every drug name, its strength/dosage, and all instructions for use.
    - **Clinical Impressions & Recommendations:** The final summary, diagnosis, or advice from the medical professional.
    - **Provider Notes:** The substantive clinical notes written by the doctor.

2.  **STRICTLY IGNORE Administrative Noise:** Actively filter out and DO NOT include any of the following:
    - Clinic/hospital contact information (names, addresses, phone numbers, emails, websites, fax numbers).
    - Patient administrative IDs (MRN, Case No., Patient ID, Accession Number, etc.).
    - Lab technician names or other administrative staff.
    - Billing codes, insurance information, or financial details.
    - Specimen collection/site details (e.g., "Collected on:", "Received on:", "Site: Left Arm").
    - Any other administrative metadata (e.g., "Reported on:", page numbers, internal lab identifiers, letterhead information).

Adhere strictly to the provided JSON schema for the given document category. Only return a valid JSON object with no additional text or markdown.

--- DOCUMENT TEXT ---
${document.extractedText}
--- END DOCUMENT TEXT ---
`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        // The response text should be a JSON string that can be parsed
        return JSON.parse(response.text);

    } catch (error) {
        console.error('Gemini structured data extraction failed:', error);
        return { error: 'Could not parse structured data from this document.' };
    }
}