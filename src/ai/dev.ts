import { config } from 'dotenv';
config();

import './genkit';
import '@/ai/flows/product-recommendations.ts';
import '@/ai/flows/data-autofill.ts';
