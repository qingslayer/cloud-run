import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
export const model = 'gemini-2.5-flash';
