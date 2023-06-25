import { sage } from '@server';
import { ChatSchema, handleValidationError } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json();
  const parseResult = ChatSchema.safeParse(payload);
  if (!parseResult.success) {
    return json(handleValidationError(parseResult.error), { status: 400 });
  }
  const chat = parseResult.data;
  // exit if any message is flagged
  const isAnyMessageFlagged = chat.messages.some(message => message.isFlagged);
  if (isAnyMessageFlagged) {
    return json({ message: 'Message is flagged' }, { status: 403 });
  }
  try {
    const messages = await sage(chat.messages, 'userId_123');
    chat.messages = messages;
    return json(chat);
  } catch (error: unknown) {
    console.error(error);
    return json({ message: 'Server Error' }, { status: 500 });
  }
};
