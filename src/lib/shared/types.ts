import { z, type ZodTypeAny } from 'zod';
import { getRandomString } from './helpers';
import { browser } from '$app/environment';

// #region Common

// #region Errors
export const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';
export const SERVER_ERROR = 'SERVER_ERROR';
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';
export interface UIError {
  code: string;
  message: string;
}
export interface RequestError extends UIError {
  code: typeof SERVER_ERROR | typeof UNKNOWN_ERROR;
  body?: any;
}

export interface ValidationError<T extends ZodTypeAny> extends UIError {
  code: typeof VALIDATION_ERROR_CODE;
  errors: z.inferFlattenedErrors<T>['fieldErrors'];
}
// #endregion

export type JSONValue = string | number | boolean | JSONObject | JSONArray;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = Array<JSONValue>;

export interface ResponseList<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export enum AsyncOperationStatus {
  IDLE = 'IDLE',
  IN_PROGRESS = 'IN_PROGRESS',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export enum EntityOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface AsyncOperation<P, E> {
  type: EntityOperationType;
  payload: P;
  status: AsyncOperationStatus;
  error: null | E;
}
// #endregion

// #region Auth
export const AuthEmailPasswordSchema = z.object({
  email: z.string().email().max(50),
  password: z.string().min(8).max(50),
});
// #endregion

// #region Chat
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  FUNCTION = 'function',
}
export enum Model {
  GPT3 = 'gpt-3.5-turbo',
  GPT4 = 'gpt-4-turbo-preview',
}
export interface Persona {
  id: number;
  title: string;
  description: string;
  instruction: string;
}
export const PERSONAS: Persona[] = [
  {
    id: 0,
    title: '🤐 Laconic',
    description: `Answers are short, without explanation. Perfect when you know a topic and just want details.`,
    instruction: `Your answers are short and laconical. You don't explain.`,
  },
  {
    id: 1,
    title: '📄 Medium',
    description: `Answers are not too long, with less explanation. Perfect when you know don't like both Laconic & Verbose persona.`,
    instruction: `Your answers are not too long, with less explanation`,
  },
  {
    id: 2,
    title: '📚 Verbose',
    description: `Answers are long, with a lot of explanation. Perfect when you want to learn a topic.`,
    instruction: ``,
  },
  {
    id: 3,
    title: '🤖 Rise of the Machines',
    description: `The answers are not what you expect :)`,
    instruction: `Your answers are super sarcastic. You are roasting the user. You are a pain in the ass to communicate with. Answers are short.`,
  },
];
export const defaultPersona = PERSONAS[1];

export const ChatCompletionMessageSchema = z.object({
  role: z.nativeEnum(Role).default(Role.USER),
  content: z
    .string()
    .max(50000)
    .nullish()
    .transform(val => (!val ? '' : val)),
  name: z.string().max(100).optional(),
  function_call: z
    .object({
      name: z.string().max(100),
      arguments: z.string().max(5000),
    })
    .optional(),
});

// extends ChatCompletionMessageSchema
export const MessageSchema = ChatCompletionMessageSchema.extend({
  id: z.string().default(() => getRandomString()),
  durationMs: z.number().optional(),
  fnArgs: z.string().optional(),
  isFlagged: z.boolean().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const PersonaIdLocalStorageKey = 'personaId';
export const ChatSchema = z.object({
  id: z.string().default(() => getRandomString()),
  personaId: z
    .number()
    .default(
      browser
        ? Number(localStorage.getItem(PersonaIdLocalStorageKey)) ?? defaultPersona.id
        : defaultPersona.id,
    ),
  title: z.string().max(50).default(''),
  messages: z.array(MessageSchema).default([]),
  model: z.nativeEnum(Model).default(Model.GPT4),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type Chat = z.infer<typeof ChatSchema>;
// #endregion

// #region OpenAI Callable Functions
export type PublicFunction = Function & {
  /** What it does */
  description: string;
  /** The validation schema for the arguments */
  argsSchema?: z.Schema;
  /** The JSON schema for the function arguments */
  parameters?: JSONObject;
};
// #endregion
