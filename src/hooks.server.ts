import { dev } from '$app/environment';
// import { auth, prisma } from '@server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  dev && console.log('\n\n');
  console.log(event.request.method, event.request.url);
  const result = await resolve(event);
  console.log(event.request.method, event.request.url, result.status, Date.now() - start + 'ms');
  dev && console.log('\n\n');
  return result;
};
