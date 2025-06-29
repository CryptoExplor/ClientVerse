'use server';

import { createGenkitHandler } from '@genkit-ai/next';

// This is the entry point for all of your Genkit flows in production.
// It's important to import all of your flows here so that they are
// registered with Genkit.
import '@/ai/flows/product-recommendations';
import '@/ai/flows/data-autofill';

export const { GET, POST, OPTIONS } = createGenkitHandler();
