import { chatgpt } from '@server';
import { ChatSchema, MessageSchema, Role, handleValidationError, type Message } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
  // if (!locals.user) {
  // 	return json({ message: 'Not signed in' }, { status: 401 });
  // }
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
    // const scenario = await prisma.scenario.create({
    // 	data: {
    // 		...parseResult.data,
    // 		userId: locals.user.userId,
    // 		access: locals.user.role === Role.ADMIN ? parseResult.data.access : ScenarioAccess.PRIVATE
    // 	}
    // });
    const messages = await chatgpt(chat.messages, 'userId_123');
    chat.messages = messages;
    return json(chat);
  } catch (error: unknown) {
    console.error(error);
    return json({ message: 'Server Error' }, { status: 500 });
  }
};

// export const GET: RequestHandler = async ({ locals, url }) => {
// 	if (!locals.user) {
// 		return json({ message: 'Not signed in' }, { status: 401 });
// 	}
// 	const page = Number(url.searchParams.get('page')) || 1;
// 	const perPage = Number(url.searchParams.get('perPage')) || 10;
// 	const where: Prisma.ScenarioWhereInput = {
// 		userId: locals.user.userId
// 	};
// 	const [data, total] = await prisma.$transaction([
// 		prisma.scenario.findMany({
// 			where,
// 			orderBy: {
// 				updatedAt: 'desc'
// 			},
// 			skip: (page - 1) * perPage,
// 			take: perPage
// 		}),
// 		prisma.scenario.count({ where })
// 	]);
// 	const result: ResponseList<Scenario> = { data, total, page, perPage };
// 	return json(result);
// };
