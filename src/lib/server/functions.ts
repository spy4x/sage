import type { PublicFunction } from '@shared';
import { z } from 'zod';
import { openai } from './openai';

function getCurrentLocation(): string {
  return 'Singapore';
}
getCurrentLocation.description = `Returns user's current location`;

function getCurrentDateTime(): string {
  return new Date().toString();
}
getCurrentDateTime.description = `Returns user's current date and time`;

function getWeather(params: { location: string }): string {
  return `The weather in ${params.location} is 30 degrees`;
}
getWeather.description = `Returns the weather in a given location`;
getWeather.argsSchema = z.object({ location: z.string() });
getWeather.parameters = {
  type: 'object',
  properties: {
    location: {
      type: 'string',
      description: 'The location to get the weather for',
    },
  },
  required: ['location'],
};

async function drawImagesFromPrompt(params: {
  prompt: string;
  userId: string;
  amount: number;
}): Promise<string[]> {
  const response = await openai.createImage({
    prompt: params.prompt,
    n: params.amount || 1,
    size: '1024x1024',
    user: params.userId,
  });
  return response.data.data.map(image => image.url!);
}
drawImagesFromPrompt.description = `Uses OpenAI Dall-e AI to draw images from a prompt and returns an array of URLs. Each URL contains an access token. Use only with the access token.`;
drawImagesFromPrompt.argsSchema = z.object({ prompt: z.string(), userId: z.string() });
drawImagesFromPrompt.parameters = {
  type: 'object',
  properties: {
    prompt: {
      type: 'string',
      description: 'The prompt to generate the image from',
    },
    amount: {
      type: 'number',
      description: "The number of images to generate. By default it's 1.",
    },
  },
  required: ['prompt'],
};

export const functions: PublicFunction[] = [
  getCurrentDateTime,
  getCurrentLocation,
  getWeather,
  drawImagesFromPrompt,
];
