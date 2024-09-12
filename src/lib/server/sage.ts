import {
  Chat,
  ChatCompletionMessageSchema,
  defaultPersona,
  type JSONValue,
  type Message,
  MessageContentType,
  MessageSchema,
  Model,
  PERSONAS,
  type PublicFunction,
  Role,
} from '@shared';
import { z } from 'zod';
import { functions } from './functions';
import { openai } from './openai';

// const functionsDescription: ChatCompletionFunctions[] = functions.map(f => ({
//   name: f.name,
//   description: f.description,
//   parameters: f.parameters || { type: 'object', properties: {} },
// }));

export async function sage(chat: Chat): Promise<Message[]> {
  const flaggedMessages = await validateUserInput(chat.messages);
  if (flaggedMessages) {
    return flaggedMessages;
  }
  const messagesWithPersona = getMessagesWithPersona(chat);
  return createChatCompletion(messagesWithPersona, functions, 'userId_123', chat.model);
}

/** Returns undefined if the user input is valid, otherwise returns the flagged messages */
async function validateUserInput(messages: Message[]): Promise<undefined | Message[]> {
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = lastMessage?.content;
  if (!lastMessageContent) {
    throw new Error('Last message has no content');
  }
  const startTime = Date.now();
  const lastMessageText = lastMessageContent.find(c => c.type === 'text')?.text;
  if (lastMessageText) {
    const validationResponse = await openai.moderations.create({
      input: lastMessageText,
    });
    const validation = validationResponse.results[0];
    if (validation.flagged) {
      lastMessage.isFlagged = true;
      lastMessage.durationMs = Date.now() - startTime;
      return messages;
    }
  }
  return undefined;
}

export function getMessagesWithPersona(chat: Chat): Message[] {
  const persona = PERSONAS.find(p => p.id === chat.personaId) || defaultPersona;
  const personaMessage = MessageSchema.parse({
    role: Role.SYSTEM,
    content: [
      {
        type: MessageContentType.TEXT,
        text: `Format your answer with Markdown. ${persona.instruction}`,
      },
    ],
  } satisfies Partial<Message>);
  return [personaMessage, ...chat.messages];
}

async function createChatCompletion(
  messages: Message[],
  functions: PublicFunction[],
  userId: string,
  model: Model,
  depth = 0,
  retries = 0,
): Promise<Message[]> {
  if (retries > 3) {
    throw new Error('Too many retries');
  }
  if (depth > 10) {
    throw new Error('Too many recursive calls');
  }

  try {
    const chatCompletionStart = Date.now();
    const response = await openai.chat.completions.create({
      model,
      messages: z.array(ChatCompletionMessageSchema).parse(messages),
      // functions: functionsDescription,
      user: userId,
    });
    const answerDurationMs = Date.now() - chatCompletionStart;

    const message = response.choices[0].message;
    if (!message) {
      throw new Error('No answer from OpenAI:' + JSON.stringify(response, null, 4));
    }
    // #region If function call
    const functionCall = message.function_call;
    if (functionCall && functionCall.name) {
      console.log('Assistant requires a function call:', message);
      const startFunction = Date.now();
      const result = await callFunction(
        functions,
        userId,
        functionCall.name,
        functionCall.arguments,
      );
      const functionDurationMs = Date.now() - startFunction;
      const updatedMessages: Message[] = [
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
      ];
      return createChatCompletion(updatedMessages, functions, userId, model, depth + 1, retries);
    }
    // #endregion

    // #region If message
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
    throw new Error('No answer from OpenAI:' + JSON.stringify(response, null, 4));
    // #endregion
  } catch (error: unknown) {
    if (retries < 3) {
      retries++;
      console.log('retrying...', { retries });
      return createChatCompletion(messages, functions, userId, model, depth + 1, retries);
    }
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

async function callFunction(
  functions: PublicFunction[],
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
