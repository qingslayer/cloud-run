import { ai, model } from './client.js';

/**
 * Search Service
 * AI-powered search across user documents
 */

/**
 * Process a natural language search query
 * @param {string} query - User's search query
 * @param {Array} documents - User's documents to search
 * @returns {Promise<{answer: string, referencedDocuments: Array}>}
 */
export async function getAIAnswer(query, documents = []) {
  const documentContext = documents
    .map(doc => {
      const a = doc.aiAnalysis || {};

      // Build structured data string (for precise lookups)
      const structuredDataStr = a.structuredData && Object.keys(a.structuredData).length > 0
        ? Object.entries(a.structuredData)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n')
        : null;

      // Build context from searchSummary (overview) + structuredData (precision)
      return `--- DOCUMENT: ${doc.displayName || doc.filename} ---
Summary: ${a.searchSummary || 'No summary available'}
${structuredDataStr ? '\nDetailed Values:\n' + structuredDataStr : ''}
--- END DOCUMENT ---`;
    })
    .join('\n\n');

  const prompt = `You are a health records assistant for a personal health app. Your task is to answer the user's question factually and concisely based *only* on the provided document context.

**MEDICAL SAFETY - CRITICAL RULES:**

1. **You are NOT a medical professional** and cannot provide medical advice, diagnoses, or treatment recommendations.

2. **Emergency Detection**: If the user's question mentions urgent/emergency symptoms (chest pain, difficulty breathing, severe bleeding, suicidal thoughts, loss of consciousness, severe allergic reaction), include this in your answer:
   "If this is a medical emergency, please call emergency services or go to the nearest emergency room immediately."

3. **No Medical Advice or Interpretation**:
   - If asked "should I...", "what does this mean for my health?", "is this serious?", respond with: "I can show you what's in your records, but I cannot provide medical interpretation or advice. Please consult your healthcare provider for medical guidance."
   - If a document contains a medical professional's interpretation, quote it directly with attribution: "According to [Document Name], Dr. [Name] noted: [exact quote]"
   - NEVER add your own medical context, significance, implications, or interpretations
   - NEVER provide unsolicited trends, patterns, or insights unless explicitly asked

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

--- MEDICAL TERMINOLOGY GUIDE ---
When interpreting user queries, be aware of these common medical term synonyms:

**Lab Tests:**
- "blood work", "blood test", "labs" = CBC, CMP, BMP, Complete Blood Count, metabolic panel, hemogram
- "cholesterol" = lipid panel, LDL, HDL, triglycerides, lipids
- "blood sugar", "sugar test" = glucose, A1C, HbA1c, fasting glucose
- "thyroid test" = TSH, T3, T4, thyroid panel
- "liver test", "liver function" = LFT, ALT, AST, bilirubin
- "kidney test", "kidney function" = creatinine, BUN, GFR, renal panel

**Imaging:**
- "x-ray", "xray" = radiograph, radiology report
- "MRI" = magnetic resonance imaging
- "CT scan", "CAT scan" = computed tomography
- "ultrasound" = sonography, US
- "mammogram" = breast imaging

**Medications:**
- "prescription", "medication", "meds", "drugs" = Rx, medicine
- "blood pressure med", "BP med" = antihypertensive, ACE inhibitor, beta blocker
- "diabetes med" = metformin, insulin, antidiabetic
- "statin" = cholesterol medication, atorvastatin, simvastatin

**Visits & Procedures:**
- "checkup", "physical" = physical exam, doctor visit, annual exam, wellness visit
- "shot", "vaccine", "immunization" = vaccination, inoculation
- "operation", "surgery" = surgical procedure, operative report

**Specialties:**
- "heart doctor" = cardiologist
- "bone doctor" = orthopedist, orthopedic surgeon
- "skin doctor" = dermatologist
- "cancer doctor" = oncologist
--- END TERMINOLOGY GUIDE ---

**User Question:** "${query}"

**Instructions:**

1. **Find the Exact Answer:** Locate the specific information within the document context that answers the user's question.

2. **Document Referencing:**
   - When asked about "latest" or "most recent", identify the document with the most recent date
   - For temporal comparisons, explicitly state dates: "Your [value] was X on [date] compared to Y on [earlier date]"
   - If multiple documents match, mention all: "I found [N] matching documents. The most recent from [date]..."

3. **Cite Your Sources:** Identify the specific document(s) that contain the answer and include them in referencedDocuments.

4. **Edge Cases:**
   - **No relevant information**: "I couldn't find information about [topic] in your uploaded records. Please refine your search or check if the document has been uploaded."
   - **Conflicting information**: "I found conflicting information: [Document A] shows [value], while [Document B] shows [different value]."
   - **Incomplete data**: "The [document name] contains partial information about [topic], but [specific detail] isn't clearly stated."

5. **Format the Output:** Return a JSON object with the fields "answer" and "referencedDocuments". The referencedDocuments should be an array of the full document objects. Do NOT include "suggestedFollowUps".

**JSON Response:**`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });
    try {
      // Extract JSON from markdown code block if present
      const jsonRegex = /```json\n([\s\S]*?)\n```/;
      const match = response.text.match(jsonRegex);
      const jsonString = match ? match[1] : response.text;

      const jsonResponse = JSON.parse(jsonString);

      // The AI returns document references (IDs or partial objects)
      // We need to map them back to the full document objects from our input
      if (jsonResponse.referencedDocuments && Array.isArray(jsonResponse.referencedDocuments)) {
        jsonResponse.referencedDocuments = jsonResponse.referencedDocuments
          .map(ref => {
            // Try to find the full document by ID or displayName
            const docId = typeof ref === 'string' ? ref : ref.id;
            const docName = typeof ref === 'object' ? ref.displayName : null;

            return documents.find(d =>
              d.id === docId ||
              d.displayName === docName ||
              (docName && d.filename === docName)
            );
          })
          .filter(Boolean); // Remove any that weren't found
      }

      return jsonResponse;
    } catch (e) {
      console.error('Error parsing AI answer JSON:', e);
      console.error('AI Response Text:', response.text);
      throw new Error('Failed to parse AI answer response.');
    }
  } catch (error) {
    console.error('AI answer generation failed:', error);
    throw new Error('Failed to generate AI answer: ' + error.message);
  }
}


export async function getAISummary(query, documents = []) {
  const documentContext = documents
    .map(doc => {
      const a = doc.aiAnalysis || {};

      // Build structured data string (for precise lookups)
      const structuredDataStr = a.structuredData && Object.keys(a.structuredData).length > 0
        ? Object.entries(a.structuredData)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n')
        : null;

      // Build context from searchSummary (overview) + structuredData (precision)
      return `--- DOCUMENT: ${doc.displayName || doc.filename} ---
Summary: ${a.searchSummary || 'No summary available'}
${structuredDataStr ? '\nDetailed Values:\n' + structuredDataStr : ''}
--- END DOCUMENT ---`;
    })
    .join('\n\n');

  const prompt = `You are a health document summarization assistant. Your task is to provide a concise, high-level overview based on the user's query and the provided document context. Identify the most relevant documents and synthesize their key findings into a brief summary.

**MEDICAL SAFETY - CRITICAL RULES:**

1. **You are NOT a medical professional** and cannot provide medical advice, diagnoses, or treatment recommendations.

2. **No Medical Interpretation**:
   - Present only what is explicitly stated in the documents
   - If a document contains a medical professional's interpretation, quote it directly with attribution
   - NEVER add your own medical context, significance, implications, or interpretations
   - NEVER provide unsolicited trends, patterns, or insights unless explicitly asked

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

--- MEDICAL TERMINOLOGY GUIDE ---
When interpreting user queries, be aware of these common medical term synonyms:

**Lab Tests:**
- "blood work", "blood test", "labs" = CBC, CMP, BMP, Complete Blood Count, metabolic panel, hemogram
- "cholesterol" = lipid panel, LDL, HDL, triglycerides, lipids
- "blood sugar", "sugar test" = glucose, A1C, HbA1c, fasting glucose
- "thyroid test" = TSH, T3, T4, thyroid panel
- "liver test", "liver function" = LFT, ALT, AST, bilirubin
- "kidney test", "kidney function" = creatinine, BUN, GFR, renal panel

**Imaging:**
- "x-ray", "xray" = radiograph, radiology report
- "MRI" = magnetic resonance imaging
- "CT scan", "CAT scan" = computed tomography
- "ultrasound" = sonography, US
- "mammogram" = breast imaging

**Medications:**
- "prescription", "medication", "meds", "drugs" = Rx, medicine
- "blood pressure med", "BP med" = antihypertensive, ACE inhibitor, beta blocker
- "diabetes med" = metformin, insulin, antidiabetic
- "statin" = cholesterol medication, atorvastatin, simvastatin

**Visits & Procedures:**
- "checkup", "physical" = physical exam, doctor visit, annual exam, wellness visit
- "shot", "vaccine", "immunization" = vaccination, inoculation
- "operation", "surgery" = surgical procedure, operative report

**Specialties:**
- "heart doctor" = cardiologist
- "bone doctor" = orthopedist, orthopedic surgeon
- "skin doctor" = dermatologist
- "cancer doctor" = oncologist
--- END TERMINOLOGY GUIDE ---

**User Query:** "${query}"

**Instructions:**

1. **Identify Relevant Documents:** Determine which of the provided documents are most relevant to the user's query.

2. **Document Referencing:**
   - When the query implies "latest" or "most recent", prioritize documents with the most recent dates
   - For queries about trends or comparisons, identify documents across different time periods

3. **Generate a Concise Summary:** Based on the relevant documents, write a 1-3 sentence summary that directly addresses the user's query. Present information factually without interpretation.

4. **List Key Documents:** List the top 3-5 most relevant documents with their display name and category.

5. **Edge Cases:**
   - **No relevant information**: "I couldn't find information about [topic] in your uploaded records. Please refine your search or check if the document has been uploaded."
   - **Conflicting information**: Note the conflict in your summary
   - **Incomplete data**: Note what information is partial or unclear

6. **Format the Output:** Return a JSON object with the following structure: { "summary": "...", "referencedDocuments": [{"id": "...", "displayName": "...", "category": "..."}] }. The referencedDocuments should be the full document objects, not just the IDs. Do NOT include "suggestedFollowUps". Make sure the JSON is valid.

**JSON Response:**`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    });
    try {
      // Extract JSON from markdown code block if present
      const jsonRegex = /```json\n([\s\S]*?)\n```/;
      const match = response.text.match(jsonRegex);
      const jsonString = match ? match[1] : response.text;

      const jsonResponse = JSON.parse(jsonString);

      // The AI returns document references (IDs or partial objects)
      // We need to map them back to the full document objects from our input
      if (jsonResponse.referencedDocuments && Array.isArray(jsonResponse.referencedDocuments)) {
        jsonResponse.referencedDocuments = jsonResponse.referencedDocuments
          .map(ref => {
            // Try to find the full document by ID or displayName
            const docId = typeof ref === 'string' ? ref : ref.id;
            const docName = typeof ref === 'object' ? ref.displayName : null;

            return documents.find(d =>
              d.id === docId ||
              d.displayName === docName ||
              (docName && d.filename === docName)
            );
          })
          .filter(Boolean); // Remove any that weren't found
      }

      return jsonResponse;
    } catch (e) {
      console.error('Error parsing AI summary JSON:', e);
      console.error('AI Response Text:', response.text);
      throw new Error('Failed to parse AI summary response.');
    }
  } catch (error) {
    console.error('AI summary generation failed:', error);
    throw new Error('Failed to generate AI summary: ' + error.message);
  }
}
