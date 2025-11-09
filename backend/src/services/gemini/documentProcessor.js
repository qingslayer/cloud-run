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
  console.log(`\n========================================`);
  console.log(`📊 STARTING DATA EXTRACTION`);
  console.log(`========================================`);

  if (!extractedText) {
    console.error('❌ No text available to parse');
    return { error: 'No text available to parse.' };
  }

  console.log(`📊 Category: "${category}"`);
  console.log(`📊 Text length: ${extractedText.length} characters`);

  const schema = getResponseSchemaForCategory(category);
  console.log(`📊 Schema generated:`, JSON.stringify(schema, null, 2));

  // Special instructions for flexible categories
  const isFlexibleCategory = !['Lab Results', 'Prescriptions', 'Imaging Reports'].includes(category);
  const flexibleInstructions = isFlexibleCategory ? `

**OUTPUT FORMAT FOR THIS CATEGORY:**
Return a JSON object with a "details" array containing key-value pairs for each piece of information.
Example: { "details": [
  { "key": "Patient Name", "value": "John Doe" },
  { "key": "Visit Date", "value": "January 15, 2024" },
  { "key": "Chief Complaint", "value": "Headache" },
  { "key": "Provider", "value": "Dr. Smith" }
]}

Use clear, human-readable field names in the "key" property. Extract each distinct piece of information as a separate object in the details array.
` : '';

  const prompt = `You are an expert medical data extraction specialist. Your task is to parse the provided medical document text and extract ALL clinically relevant information into a structured JSON object.

**Document Type:** "${category}"
${flexibleInstructions}
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
${extractedText}
--- END DOCUMENT TEXT ---
`;

  try {
    console.log(`📊 Calling Gemini API...`);
    console.log(`📊 Flexible category: ${isFlexibleCategory}`);

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    console.log(`✅ Gemini API responded`);
    console.log(`📊 Raw response length:`, response.text?.length || 0);
    console.log(`📊 Raw response (first 500 chars):`, response.text?.substring(0, 500));

    const parsedData = JSON.parse(response.text);
    console.log(`✅ JSON parsed successfully`);
    console.log(`📊 Result keys:`, Object.keys(parsedData));
    console.log(`📊 Result preview:`, JSON.stringify(parsedData, null, 2).substring(0, 500));

    // Transform flexible category data from array to flat object
    if (isFlexibleCategory && parsedData.details && Array.isArray(parsedData.details)) {
      console.log(`📊 Transforming details array to flat object...`);
      const flatObject = parsedData.details.reduce((acc, item) => {
        if (item.key && item.value) {
          acc[item.key] = item.value;
        }
        return acc;
      }, {});
      console.log(`✅ Transformed to flat object with keys:`, Object.keys(flatObject));
      return flatObject;
    }

    return parsedData;
  } catch (error) {
    console.error(`\n❌❌❌ DATA EXTRACTION FAILED ❌❌❌`);
    console.error(`❌ Error type: ${error.constructor.name}`);
    console.error(`❌ Error message:`, error.message);
    console.error(`❌ Full error:`, error);
    console.error(`❌ Stack trace:`, error.stack);
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
  console.log(`🔍 Generating search summary for category: ${category}`);

  // Build context from structured data
  const structuredContext = structuredData && Object.keys(structuredData).length > 0
    ? JSON.stringify(structuredData, null, 2)
    : 'No structured data available';

  const prompt = `You are creating a concise search summary for a medical document. This summary will be used by an AI to answer user questions efficiently.

**Document Category:** ${category}

**Structured Data:**
${structuredContext}

**Full Text (first 3000 chars):**
${extractedText.substring(0, 3000)}

**Your Task:**
Create a 200-500 character summary that includes:
1. Document type and date (if available)
2. Provider/facility (if available)
3. Key medical findings, values, or information
4. All findings (both normal and abnormal values)
5. Overall conclusion/impression if stated in the document

**Format Guidelines:**
- Be concise but information-dense
- Use natural language (not bullet points)
- Include specific medical values when relevant
- Present all findings factually without interpretation or emphasis
- Do NOT add prefixes like ⚠️ or labels like "HIGH" unless they appear in the original document
- Include what the document states about normal vs abnormal results
- Make it easy for AI to answer questions like "what's my cholesterol?" or "when was my last checkup?"

**Example for Lab Results:**
"Complete Blood Count from October 15, 2023 at LabCorp by Dr. Smith. WBC 7.2, RBC 4.8, Hemoglobin 14.2 g/dL, Platelets 245k. All values within normal reference ranges. No abnormalities detected."

**Example for Prescription:**
"Prescription from Dr. Johnson dated March 3, 2024. Lisinopril 10mg once daily for blood pressure management. Metformin 500mg twice daily with meals for diabetes control. 30-day supply with 2 refills available."

**Example for Lab Results with Abnormalities (as stated in document):**
"Lipid Panel from January 12, 2024 at CardioClinic by Dr. Martinez. Total cholesterol 245 mg/dL (reference <200), LDL 160 mg/dL (reference <100), HDL 45 mg/dL (reference >40), Triglycerides 200 mg/dL (reference <150). Doctor noted elevated cardiovascular risk."

Now create the summary:`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });

    const summary = response.text.trim();
    console.log(`✅ Search summary generated (${summary.length} chars)`);
    return summary;
  } catch (error) {
    console.error('❌ Failed to generate search summary:', error);
    // Fallback: create basic summary from available data
    const fallback = `${category} document. ${structuredData && Object.keys(structuredData).length > 0 ? 'Contains structured medical data.' : 'No structured data available.'}`;
    console.log(`⚠️ Using fallback summary: ${fallback}`);
    return fallback;
  }
}

