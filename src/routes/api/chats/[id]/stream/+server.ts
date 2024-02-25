import type { RequestHandler } from '@sveltejs/kit';
import { chatsMap } from '../../store';

export const GET: RequestHandler = async ({ params }) => {
  const chatId = params.id!;

  const chatObjects = chatsMap.get(chatId);

  if (!chatObjects) {
    return new Response('Chat not found', { status: 404 });
  }
  if (chatObjects.hasFinished) {
    return new Response('Chat has finished', { status: 404 });
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of chatObjects.openAIStream) {
        if (chunk.choices[0]?.delta?.content === undefined) {
          controller.close();
          chatObjects.hasFinished = true;
          break;
        }
        // send chunk.choices[0]?.delta?.content to client
        const message = chunk.choices[0]?.delta?.content;
        const data = `event: message\ndata: ${JSON.stringify({
          chunk: message,
        })}\n\n`;
        controller.enqueue(data);
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};
