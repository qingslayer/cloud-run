import { ai, model } from './client.js';

function createSystemInstruction(documents) {
  const documentContext = documents
    .map(doc => {
      const a = doc.aiAnalysis || {};
      const structuredDataStr = a.structuredData
        ? Object.entries(a.structuredData)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n')
        : 'No structured data available';

      return `--- DOCUMENT: ${doc.displayName || doc.filename} (Category: ${doc.category}) ---
Structured Data:
${structuredDataStr}

Full Text:
${a.extractedText || 'No text extracted'}
--- END DOCUMENT ---`;
    })
    .join('\n\n');

  return `You are analyzing medical records. CRITICAL RULES:

Only use information from the provided documents.
If information is not in the documents, clearly state: 'I don't have that information in your records'.
NEVER guess, estimate, or make up medical information.
If a question is unclear, ask for clarification.
Always cite specific documents when providing factual information.
When you reference specific medical documents in your answer, note their IDs.
Format: After your answer, list referenced document IDs like: [REFS: doc_id_1, doc_id_2]

--- DOCUMENT CONTEXT ---
${documentContext}
--- END DOCUMENT CONTEXT ---

--- MEDICAL TERMINOLOGY GUIDE ---
When interpreting user queries, be aware of these common medical term synonyms:
- "blood work", "blood test" = CBC, Complete Blood Count, hemogram
- "cholesterol" = lipid panel, LDL, HDL, lipids
- "x-ray", "xray" = radiograph, radiology report
- "MRI" = magnetic resonance imaging
- "CT scan" = computed tomography, CAT scan
- "prescription", "medication", "meds" = Rx, drug, medicine
- "checkup" = physical exam, doctor visit, annual exam

When a user asks about "blood work" or "blood test", look for documents containing CBC, Complete Blood Count, or hemogram data.
When a user asks about "cholesterol", look for lipid panel results with LDL/HDL values.
When a user asks about imaging like "x-ray" or "MRI", look for corresponding radiology or imaging reports.
--- END TERMINOLOGY GUIDE ---`;
}

function parseAIResponse(text) {
  const refRegex = /\[REFS: (.*?)\]/;
  const match = text.match(refRegex);
  let referencedDocuments = [];
  let answer = text;

  if (match) {
    answer = text.replace(refRegex, '').trim();
    referencedDocuments = match[1].split(',').map(id => id.trim());
  }

  return { answer, referencedDocuments };
}

export async function getAIChatResponse(query, documents, history = []) {
  const systemInstruction = createSystemInstruction(documents);
  const chat = ai.chats.create({
    model,
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })),
    config: {
      systemInstruction,
    },
  });

  const result = await chat.sendMessage({ message: query });
  const { answer, referencedDocuments: docIds } = parseAIResponse(result.text);

  // Map document IDs back to full document objects
  const referencedDocuments = docIds
    .map(id => documents.find(d => d.id === id || d.displayName === id || d.filename === id))
    .filter(Boolean); // Remove any that weren't found

  return {
    answer,
    referencedDocuments,
    suggestedFollowUps: [], // Suggested follow-ups can be added here
  };
}
