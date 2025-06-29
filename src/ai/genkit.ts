import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { firebasePlugin } from '@genkit-ai/firebase';
import { nextPlugin } from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI(), firebasePlugin(), nextPlugin()],
  model: 'googleai/gemini-2.0-flash',
});
