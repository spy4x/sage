import { env } from '$env/dynamic/private';
import OpenAI from 'openai';

const apiKey = env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(
    'No OpenAI API key found in environment variables. OpenAI API will not be available.',
  );
}

const openai = new OpenAI({
  apiKey: apiKey || 'sk-fake',
});

export { openai };

export type ChatCompletion = OpenAI.ChatCompletion;
export type ChatCompletionChunk = OpenAI.ChatCompletionChunk;
export type { Stream } from 'openai/streaming';
