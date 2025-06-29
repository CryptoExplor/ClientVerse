// src/ai/flows/product-recommendations.ts
'use server';
/**
 * @fileOverview An AI agent that analyzes client data and suggests relevant insurance and investment products.
 *
 * - getProductRecommendations - A function that handles the product recommendation process.
 * - ProductRecommendationsInput - The input type for the getProductRecommendations function.
 * - ProductRecommendationsOutput - The return type for the getProductRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductRecommendationsInputSchema = z.object({
  clientData: z
    .string()
    .describe('The client data as a JSON string, including financial information, policies, and family details.'),
});
export type ProductRecommendationsInput = z.infer<typeof ProductRecommendationsInputSchema>;

const ProductRecommendationsOutputSchema = z.object({
  insuranceRecommendations: z.array(z.string()).describe('Recommended insurance products based on client data.'),
  investmentRecommendations: z
    .array(z.string())
    .describe('Recommended investment products based on client data.'),
});
export type ProductRecommendationsOutput = z.infer<typeof ProductRecommendationsOutputSchema>;

export async function getProductRecommendations(input: ProductRecommendationsInput): Promise<ProductRecommendationsOutput> {
  return productRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productRecommendationsPrompt',
  input: {schema: ProductRecommendationsInputSchema},
  output: {schema: ProductRecommendationsOutputSchema},
  prompt: `You are an expert financial advisor. Analyze the client data provided and suggest relevant insurance and investment products to enhance cross-selling opportunities.

Client Data: {{{clientData}}}

Provide clear and concise recommendations, explaining why each product is suitable for the client.

Output the insurance and investment recommendations in the specified JSON format.`,
});

const productRecommendationsFlow = ai.defineFlow(
  {
    name: 'productRecommendationsFlow',
    inputSchema: ProductRecommendationsInputSchema,
    outputSchema: ProductRecommendationsOutputSchema,
  },
  async input => {
    try {
      // Parse the clientData string to a JSON object
      const clientData = JSON.parse(input.clientData);
      // Add any additional data processing or validation here if needed

      const {output} = await prompt({clientData: JSON.stringify(clientData)});
      return output!;
    } catch (error) {
      console.error('Error parsing client data:', error);
      throw new Error('Invalid client data format.');
    }
  }
);
