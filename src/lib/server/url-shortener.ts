import { getRandomString } from '@shared';
import { API_CONFIG } from './config';

/** Contains shorter alias "/media/dall-e/g542r" for longer url "https://oaidalleapiprodscus.blob.core.windows.net/private/***" */
const urlsMap = new Map<string, string>();

export function shortenURL(longURL: string): string {
  const shortURL = `${API_CONFIG.appURL}/media/dall-e/${getRandomString()}`;
  console.log('shortenURL', { shortURL, longURL });
  urlsMap.set(shortURL, longURL);
  return shortURL;
}

export function longenURL(shortURL: string): string | undefined {
  const longURL = urlsMap.get(shortURL);
  console.log('longenURL', { shortURL, longURL });
  return longURL;
}
