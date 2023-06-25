import { Configuration, OpenAIApi, type ChatCompletionFunctions } from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

export { ChatCompletionFunctions, openai };
