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
      let answer = '';
      for await (const chunk of chatObjects.openAIStream) {
        if (chunk.choices[0]?.delta?.content === undefined) {
          console.log('chatObjects.openAIStream ended');
          controller.close();
          chatObjects.hasFinished = true;
          console.log({ answer });
          break;
        }
        // send chunk.choices[0]?.delta?.content to client
        const content = chunk.choices[0]?.delta?.content;
        answer += content;
        const data = `event: message\ndata: ${JSON.stringify({
          message: chunk.choices[0].delta.content,
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
