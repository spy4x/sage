import {
  getRandomString,
  MessageSchema,
  type JSONObject,
  type JSONValue,
  type Message,
  Role,
  ChatCompletionMessageSchema,
} from '@shared';
import {
  Configuration,
  CreateImageRequestSizeEnum,
  OpenAIApi,
  type ChatCompletionFunctions,
} from 'openai';
import { get } from 'svelte/store';

import { z } from 'zod';

const apiKey = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey });
export const openai = new OpenAIApi(configuration);

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
  return createImage(params.prompt, params.userId, params.amount || 1);
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

type PublicFunction = Function & {
  /** What it does */
  description: string;
  /** The validation schema for the arguments */
  argsSchema?: z.Schema;
  /** The JSON schema for the function arguments */
  parameters?: JSONObject;
};

const functions: PublicFunction[] = [
  getCurrentDateTime,
  getCurrentLocation,
  getWeather,
  drawImagesFromPrompt,
];

const functionsDescription: ChatCompletionFunctions[] = functions.map(f => ({
  name: f.name,
  description: f.description,
  parameters: f.parameters || { type: 'object', properties: {} },
}));

async function callFunction(
  userId: string,
  name: string,
  args?: string,
): Promise<{ fn: PublicFunction; result: JSONValue }> {
  const fn = functions.find(f => f.name === name);
  if (!fn) {
    throw new Error(`Function "${name}" not found`);
  }
  let argsJSON = { userId };
  if (args) {
    argsJSON = { ...argsJSON, ...JSON.parse(args) };
  }
  if (fn.argsSchema) {
    if (!args) {
      throw new Error(`Function "${name}" requires arguments`);
    }
    fn.argsSchema.parse(argsJSON);
  }
  console.log('calling function:', { name, argsJSON });
  try {
    const result = await fn(argsJSON);
    console.log('function called:', { name, args, argsJSON, result });
    return { fn, result };
  } catch (error: unknown) {
    console.error('function error:', { name, args, argsJSON, error });
    return { fn, result: (error as Error).message };
  }
}

export async function createChatCompletion(
  messages: Message[],
  userId: string,
  depth = 0,
): Promise<Message[]> {
  if (depth > 10) {
    throw new Error('Too many recursive calls');
  }
  try {
    const chatCompletionStart = Date.now();
    let response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0613',
      messages: z.array(ChatCompletionMessageSchema).parse(messages),
      functions: functionsDescription,
      user: userId,
    });
    const answerDurationMs = Date.now() - chatCompletionStart;

    const message = response.data.choices[0].message;
    if (!message) {
      throw new Error('No answer from OpenAI:' + JSON.stringify(response.data, null, 4));
    }
    const functionCall = message.function_call;
    if (functionCall && functionCall.name) {
      console.log('Assistant requires a function call:', message);
      const startFunction = Date.now();
      const result = await callFunction(userId, functionCall.name, functionCall.arguments);
      const functionDurationMs = Date.now() - startFunction;
      return createChatCompletion(
        [
          ...messages,
          {
            // Assistant's request to call a function
            ...MessageSchema.parse({
              role: Role.ASSISTANT,
              durationMs: answerDurationMs,
            } satisfies Partial<Message>),
            ...(message as any),
          },
          MessageSchema.parse({
            // Function's response
            role: Role.FUNCTION,
            durationMs: functionDurationMs,
            name: functionCall.name,
            fnArgs: functionCall.arguments,
            content: JSON.stringify(result.result),
          } satisfies Partial<Message>),
        ],
        userId,
        depth + 1,
      );
    }

    if (message.content) {
      return [
        ...messages,
        MessageSchema.parse({
          role: Role.ASSISTANT,
          durationMs: answerDurationMs,
          content: message.content,
        } satisfies Partial<Message>),
      ];
    }
    throw new Error('No answer from OpenAI:' + JSON.stringify(response.data, null, 4));
  } catch (error: unknown) {
    const axiosError = error as any;
    if (axiosError.response) {
      console.error(axiosError.response.status, axiosError.response.data);
    } else {
      console.error(error);
    }
    // fallback
    return [
      ...messages,
      MessageSchema.parse({
        role: Role.ASSISTANT,
        content: 'Sorry, I am not feeling well today. Please try again later.',
      } satisfies Partial<Message>),
    ];
  }
}

export async function createImage(
  prompt: string,
  userId: string,
  amount = 10,
  size: CreateImageRequestSizeEnum = '1024x1024',
): Promise<string[]> {
  const response = await openai.createImage({
    prompt,
    n: amount,
    size,
    user: userId,
  });
  return response.data.data.map(image => image.url!);
}
