// export map with all chats that server keeps track of, for streaming
import type { Chat } from '@shared';
import type { ChatCompletion, Stream, ChatCompletionChunk } from '@server/openai';

export type ChatObjects = {
  chat: Chat;
  openAIStream: ChatCompletion & Stream<ChatCompletionChunk>;
  hasFinished: boolean;
};

export const chatsMap = new Map<string, ChatObjects>();
