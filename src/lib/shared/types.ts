import { z, type ZodTypeAny } from 'zod';
import { getRandomString } from './helpers';

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

export const ChatSchema = z.object({
  id: z.string().default(() => getRandomString()),
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
