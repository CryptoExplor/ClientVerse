import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import * as genkitNext from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI(), genkitNext.next()],
  model: 'googleai/gemini-2.0-flash',
});
