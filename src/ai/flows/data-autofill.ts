'use server';

/**
 * @fileOverview A data autofill AI agent.
 *
 * - autofillData - A function that handles the data autofill process.
 * - AutofillDataInput - The input type for the autofillData function.
 * - AutofillDataOutput - The return type for the autofillData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutofillDataInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  availableData: z
    .string()
    .describe(
      'Available client information to use as context, such as partial address, phone number, or other details.'
    ),
  missingFields: z
    .string()
    .describe(
      'A comma-separated list of the fields that need to be autofilled, e.g., address, phone number.'
    ),
});
export type AutofillDataInput = z.infer<typeof AutofillDataInputSchema>;

const AutofillDataOutputSchema = z.object({
  autofilledData: z
    .string()
    .describe(
      'A JSON object containing the autofilled data for the requested fields.'
    ),
});
export type AutofillDataOutput = z.infer<typeof AutofillDataOutputSchema>;

export async function autofillData(input: AutofillDataInput): Promise<AutofillDataOutput> {
  return autofillDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autofillDataPrompt',
  input: {schema: AutofillDataInputSchema},
  output: {schema: AutofillDataOutputSchema},
  prompt: `You are an AI assistant that helps autofill missing client information based on available data.

  The client's name is {{{clientName}}}.

  You are given the following available data about the client:
  {{availableData}}

  The following fields need to be autofilled:
  {{missingFields}}

  Return the autofilled data as a JSON object.  If you cannot fill a particular field, leave it blank in the JSON.  Do not add any conversational text before or after the JSON object.
  Ensure that the returned JSON is valid and can be parsed without errors. Include only the requested fields in the JSON. Use your best judgement to provide accurate and complete information.

  Here is the JSON:
  `,
});

const autofillDataFlow = ai.defineFlow(
  {
    name: 'autofillDataFlow',
    inputSchema: AutofillDataInputSchema,
    outputSchema: AutofillDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
