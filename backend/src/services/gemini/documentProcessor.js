import { ai, model } from './client.js';
import { Type } from '@google/genai';

/**
 * Document Processing Service
 * Handles OCR, text extraction, categorization, and structured data extraction
 */

const DOCUMENT_CATEGORIES = [
  'Lab Results',
  'Prescriptions',
  'Imaging Reports',
  "Doctor's Notes",
  'Vaccination Records',
  'Other'
];

/**
 * Extract text from a document (PDF, image, etc.)
 * @param {string} base64Data - Base64 encoded document data
 * @param {string} mimeType - Document MIME type
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromDocument(base64Data, mimeType) {
  if (!base64Data) {
    throw new Error('Base64 data is required for text extraction');
  }

  const generativePart = {
    inlineData: {
      data: base64Data.includes(',') ? base64Data.split(',')[1] : base64Data,
      mimeType: mimeType,
    },
  };

  const prompt = 
    "Extract and return all text content from the provided document. " +
    "If it is an image, perform OCR. Be as accurate as possible. " +
    "Only return the extracted text, with no additional commentary or formatting.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [generativePart, { text: prompt }] }
    });
    return response.text;
  } catch (error) {
    console.error('Gemini text extraction failed:', error);
    throw new Error('Could not extract text from document: ' + error.message);
  }
}

/**
 * Analyze and categorize a document based on its text content
 * @param {string} text - Document text content
 * @returns {Promise<{title: string, category: string}>}
 */
export async function analyzeAndCategorizeDocument(text) {
  const prompt = `Analyze the following medical document text. Based on its content, provide a concise, human-readable title and determine the most appropriate category from the provided list.

Categories: ${DOCUMENT_CATEGORIES.join(', ')}

--- DOCUMENT TEXT ---
${text.substring(0, 10000)}
--- END DOCUMENT TEXT ---

Respond with a JSON object containing "title" and "category". The title should be descriptive but DO NOT include dates (e.g., "Complete Blood Count", "Chest X-Ray Report", "Lipitor Prescription"). The category must be one of the exact strings from the list provided.`;

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
            category: { 
              type: Type.STRING,
              enum: DOCUMENT_CATEGORIES
            }
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
}

/**
 * Get response schema based on document category
 * @param {string} category - Document category
 * @returns {object} JSON schema for structured data
 */
function getResponseSchemaForCategory(category) {
  switch (category) {
    case 'Lab Results':
      return {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Test or collection date (format: YYYY-MM-DD)' },
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
        },
        required: ['results']
      };
    case 'Prescriptions':
      return {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Prescription date (format: YYYY-MM-DD)' },
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
        },
        required: ['prescriptions']
      };
    case 'Imaging Reports':
      return {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Exam or report date (format: YYYY-MM-DD)' },
          procedure: { type: Type.STRING },
          findings: { type: Type.STRING },
          impression: { type: Type.STRING },
        },
        required: ['procedure', 'findings', 'impression']
      };
    default:
      // Flexible schema for any document type
      // Gemini API requires non-empty properties for OBJECT type, so we use an array of key-value pairs
      // This will be transformed to a flat object after extraction
      return {
        type: Type.OBJECT,
        properties: {
          details: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING, description: 'Field name (e.g., "Patient Name", "Visit Date")' },
                value: { type: Type.STRING, description: 'Field value' },
              },
              required: ['key', 'value']
            }
          }
        },
        required: ['details']
      };
  }
}

/**
 * Extract structured data from a document
 * @param {string} extractedText - Text extracted from document
 * @param {string} category - Document category
 * @returns {Promise<object>} Structured data
 */
export async function extractStructuredData(extractedText, category) {
  if (!extractedText) {
    return { error: 'No text available to parse.' };
  }

  const schema = getResponseSchemaForCategory(category);

  const isFlexibleCategory = !['Lab Results', 'Prescriptions', 'Imaging Reports'].includes(category);
  const flexibleInstructions = isFlexibleCategory ? `

**OUTPUT FORMAT FOR THIS CATEGORY:**
Return a JSON object with a "details" array containing key-value pairs for each piece of information.
Example: { "details": [
  { "key": "date", "value": "2024-01-15" },
  { "key": "Patient Name", "value": "John Doe" },
  { "key": "Chief Complaint", "value": "Headache" },
  { "key": "Provider", "value": "Dr. Smith" }
]}

IMPORTANT: Always include a "date" key with the document/visit/service date in YYYY-MM-DD format as the first item. Use clear, human-readable field names for other keys. Extract each distinct piece of information as a separate object in the details array.
` : '';

  const prompt = `You are an expert medical data extraction specialist with comprehensive knowledge of medical terminology, test names, and clinical documentation.

**Document Type:** "${category}"
${flexibleInstructions}

**Core Task:** Extract ALL clinically relevant information from this medical document into structured JSON. Use your medical expertise to identify:

1. **Document Date** (REQUIRED): Extract as "date" field in YYYY-MM-DD format. Look for test/collection/exam/visit/prescription dates (prioritize clinical event date over report generation date).

2. **Clinical Information**: ALL medical findings, test results, medications, diagnoses, provider names, and clinical impressions. Be comprehensive - don't summarize.

3. **Ignore Administrative Data**: Contact info, patient IDs, billing codes, specimen collection details, and other non-clinical metadata.

**Your Medical Knowledge**: Leverage your understanding of medical terminology, standard test names, reference ranges, and clinical documentation to extract accurate, complete information.

Adhere strictly to the provided JSON schema. Return only valid JSON with no additional text.

--- DOCUMENT TEXT ---
${extractedText}
--- END DOCUMENT TEXT ---
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const parsedData = JSON.parse(response.text);

    if (isFlexibleCategory && parsedData.details && Array.isArray(parsedData.details)) {
      const flatObject = parsedData.details.reduce((acc, item) => {
        if (item.key && item.value) {
          acc[item.key] = item.value;
        }
        return acc;
      }, {});
      return flatObject;
    }

    return parsedData;
  } catch (error) {
    console.error('❌ Data extraction failed:', error.message);
    return { error: 'Could not parse structured data from this document.' };
  }
}

/**
 * Generate a concise search summary for efficient AI querying
 * This summary is used during search instead of the full extractedText
 * to dramatically reduce context size and improve performance.
 *
 * @param {string} extractedText - Full text extracted from document
 * @param {string} category - Document category
 * @param {object} structuredData - Structured data extracted from document
 * @returns {Promise<string>} Concise search summary (200-500 characters)
 */
export async function generateSearchSummary(extractedText, category, structuredData) {
  // Build context from structured data
  const structuredContext = structuredData && Object.keys(structuredData).length > 0
    ? JSON.stringify(structuredData, null, 2)
    : 'No structured data available';

  const prompt = `You are creating a concise search summary for a medical document. This summary will be used by an AI to answer user questions efficiently.

Create a concise 200-500 character search summary for this ${category} document.

**Structured Data:**
${structuredContext}

**Document Text (first 8000 chars):**
${extractedText.substring(0, 8000)}

**Requirements:**
- Include: document type, date, provider/facility, key findings/values, overall conclusion
- Use natural language (not bullet points)
- Include specific medical values when relevant
- Present findings factually without interpretation
- Leverage your medical knowledge to identify what's clinically significant

**Example:** "Complete Blood Count from October 15, 2023 at LabCorp by Dr. Smith. WBC 7.2, RBC 4.8, Hemoglobin 14.2 g/dL, Platelets 245k. All values within normal ranges."

Generate the summary:`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });

    return response.text.trim();
  } catch (error) {
    console.error('❌ Failed to generate search summary:', error);
    return `${category} document. ${structuredData && Object.keys(structuredData).length > 0 ? 'Contains structured medical data.' : 'No structured data available.'}`;
  }
}

