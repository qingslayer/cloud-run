import { ai, model } from './client.js';

function createSystemInstruction(documents) {
  const documentContext = documents
    .map(doc => {
      const a = doc.aiAnalysis || {};
      const keyFindings = (a.keyFindings || []).map(f => `- ${f.finding}: ${f.result}`).join('\n');
      return `--- DOCUMENT: ${doc.displayName} (Category: ${doc.category}) ---\nSummary: ${a.summary}\nProvider: ${a.provider}\nKey Findings:\n${keyFindings}\n--- END DOCUMENT ---`;
    })
    .join('\n\n');

  return `You are analyzing medical records. CRITICAL RULES:

Only use information from the provided documents.
If information is not in the documents, clearly state: 'I don't have that information in your records'.
NEVER guess, estimate, or make up medical information.
If a question is unclear, ask for clarification.
Always cite specific documents when providing factual information.
When you reference specific medical documents in your answer, note their IDs.
Format: After your answer, list referenced document IDs like: [REFS: doc_id_1, doc_id_2]`;
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
  const { answer, referencedDocuments } = parseAIResponse(result.text);

  return {
    answer,
    referencedDocuments,
    suggestedFollowUps: [], // Suggested follow-ups can be added here
  };
}

