import { longenURL } from '@server';
import { redirect, type RequestHandler } from '@sveltejs/kit';

/** Receives /media/dall-e/:id and redirects it to longenURL(/media/dall-e/:id) */
export const GET: RequestHandler = ({ url }) => {
  const shortURL = url.href;
  const longURL = longenURL(shortURL);
  if (!longURL) {
    return new Response('Not found', { status: 404 });
  }
  throw redirect(302, longURL);
};
