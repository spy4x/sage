import { dev } from '$app/environment';
import { API_CONFIG } from '@server/config';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();
  dev && console.log('\n\n');
  if (!API_CONFIG.appURL) {
    // initialize API_CONFIG.appURL on first request
    API_CONFIG.appURL = event.url.protocol + '//' + event.url.host;
  }
  console.log(event.request.method, event.request.url);
  const result = await resolve(event);
  console.log(event.request.method, event.request.url, result.status, Date.now() - start + 'ms');
  dev && console.log('\n\n');
  return result;
};
