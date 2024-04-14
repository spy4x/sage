import { ChatCompletionMessageSchema, ChatSchema, handleValidationError } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';
import { openai } from '@server/openai';
import { z } from 'zod';
import { chatsMap } from './store';
import { getMessagesWithPersona } from '@server';

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json();
  const parseResult = ChatSchema.safeParse(payload);
  if (!parseResult.success) {
    return json(handleValidationError(parseResult.error), { status: 400 });
  }
  const chat = parseResult.data;
  console.log(`message:`, chat.messages[chat.messages.length - 1].content);
  // exit if any message is flagged
  const isAnyMessageFlagged = chat.messages.some(message => message.isFlagged);
  if (isAnyMessageFlagged) {
    return json({ message: 'Message is flagged' }, { status: 403 });
  }

  try {
    const openAIStream = await openai.chat.completions.create({
      model: chat.model,
      messages: z.array(ChatCompletionMessageSchema).parse(getMessagesWithPersona(chat)),
      user: 'userId_123',
      stream: true,
    });
    chatsMap.set(chat.id, { chat, openAIStream, hasFinished: false });
    // chat.messages = await sage(chat);
    return json({ message: 'Chat is being processed' });
  } catch (error: unknown) {
    console.error(error);
    return json({ message: 'Server Error' }, { status: 500 });
  }
};
