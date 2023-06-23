import { getRandomString, Role, type Message, MessageSchema } from '@shared';
import { createChatCompletion, openai } from './openai';

export async function chatgpt(messages: Message[], userId: string): Promise<Message[]> {
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent = lastMessage?.content;
  if (!lastMessageContent) {
    throw new Error('Last message has no content');
  }
  const startTime = Date.now();
  const validationResponse = await openai.createModeration({
    input: lastMessageContent,
  });
  const validation = validationResponse.data.results[0];
  if (validation.flagged) {
    lastMessage.isFlagged = true;
    lastMessage.durationMs = Date.now() - startTime;
    return messages;
  }
  const newMessages = await generateAnswer(messages, userId);
  return newMessages;
}

async function generateAnswer(messages: Message[], userId: string): Promise<Message[]> {
  // TODO: calculate tokens and cut off older messages
  const completionMessages = await createChatCompletion(
    [
      MessageSchema.parse({
        role: Role.SYSTEM,
        content: `You are a friendly assistant. You are super concise and use as few words as needed for an answer. You make jokes, fun and even sarcastic. You answer using Markdown code when text should be structure. If you need to write programming code snippets - use correct Markdown format, like \`\`\`javascript alert("Hello World!") \`\`\`.`,
      } satisfies Partial<Message>),
      ...messages,
    ],
    userId,
  );
  console.log('answer:', completionMessages);
  return completionMessages;
}

export async function generateTitle(message: string, userId: string): Promise<string> {
  const messages = await createChatCompletion(
    [
      MessageSchema.parse({
        role: Role.USER,
        content: `Summarize text into max 3 words. No quotes or special characters. Text:"""
${message}
"""`,
      }),
    ],
    userId,
  );
  return messages[messages.length - 1].content ?? 'No title';
}
