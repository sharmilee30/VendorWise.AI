import { GoogleGenAI } from '@google/genai';

console.log('Testing GoogleGenAI initialization...');
const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
console.log(`[DEV LOG] GEMINI_API_KEY exists: ${hasKey ? 'TRUE' : 'FALSE'}`);

try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'test-key-placeholder' });
  console.log('GoogleGenAI instance created successfully:', Boolean(ai));
} catch (err: any) {
  console.error('Error instantiating GoogleGenAI:', err);
}
