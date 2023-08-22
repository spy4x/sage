import type { PublicFunction } from '@shared';
import { z } from 'zod';
import { openai } from './openai';
import { shortenURL } from './url-shortener';

async function drawImagesFromPrompt(params: {
  prompt: string;
  userId: string;
  amount: number;
}): Promise<string[]> {
  const response = await openai.images.generate({
    prompt: params.prompt,
    n: params.amount || 1,
    size: '1024x1024',
    user: params.userId,
  });
  return response.data.map(image => shortenURL(image.url!));
}
drawImagesFromPrompt.description = `Uses OpenAI Dall-e AI to draw images from a prompt and returns an array of URLs.`;
drawImagesFromPrompt.argsSchema = z.object({
  prompt: z.string(),
  userId: z.string(),
  amount: z.number().min(1).max(10).optional(),
});
drawImagesFromPrompt.parameters = {
  type: 'object',
  properties: {
    prompt: {
      type: 'string',
      description: 'The prompt to generate the image from',
    },
    amount: {
      type: 'number',
      description: "The number of images to generate. By default it's 1. Max is 10.",
    },
  },
  required: ['prompt'],
};

export const functions: PublicFunction[] = [drawImagesFromPrompt];
