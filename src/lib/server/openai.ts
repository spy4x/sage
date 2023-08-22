import { env } from '$env/dynamic/private';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export { openai };
