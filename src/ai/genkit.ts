import { defineConfig } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { firebaseHosting } from '@genkit-ai/firebase-hosting';
import { nextHandler } from '@genkit-ai/nextjs';

export const ai = defineConfig({
  plugins: [
    googleAI(),         // ✅ valid
    firebaseHosting(),  // ✅ correct function to use
    nextHandler()       // ✅ correct for Next.js API routing
  ],
  model: 'googleai/gemini-2.0-flash',
});
