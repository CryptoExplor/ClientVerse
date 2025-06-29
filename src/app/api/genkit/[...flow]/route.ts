'use server';

import { createApiHandler } from '@genkit-ai/next';

// Import all Genkit flows so they are registered
import '@/ai/flows/product-recommendations';
import '@/ai/flows/data-autofill';

export const { GET, POST, OPTIONS } = createApiHandler();
