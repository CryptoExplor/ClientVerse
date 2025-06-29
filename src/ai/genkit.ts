import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {next} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI(), firebase(), next()],
  model: 'googleai/gemini-2.0-flash',
});
