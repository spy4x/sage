import lucia, { type AuthRequest, type Session } from 'lucia-auth';
import { sveltekit } from 'lucia-auth/middleware';
import prismaAdapter from '@lucia-auth/adapter-prisma';
import { facebook, google } from '@lucia-auth/oauth/providers';
import { prisma } from './prisma';
import type { AuthUser } from '@prisma/client';
import { dev } from '$app/environment';
import { APP_URL, AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';
import { USER_ID_COOKIE_NAME } from '@shared';

export interface LuciaUser extends AuthUser {
  userId: string;
}

export const auth = lucia({
  adapter: prismaAdapter(prisma),
  env: dev ? 'DEV' : 'PROD',
  middleware: sveltekit(),
  transformDatabaseUser: (user): LuciaUser => {
    return {
      ...user,
      userId: user.id,
    };
  },
});

export function setSession(
  req: AuthRequest,
  cookies: Cookies,
  user: LuciaUser,
  session: Session,
): void {
  req.setSession(session);
  // set js-accessible cookie with user.id
  cookies.set(USER_ID_COOKIE_NAME, user.id, {
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 14, // 2 weeks
    httpOnly: false,
    sameSite: 'strict',
    secure: dev ? false : true,
  });
}

export async function invalidateSession(
  req: AuthRequest,
  cookies: Cookies,
  sessionId?: string,
): Promise<void> {
  if (sessionId) {
    await auth.invalidateSession(sessionId);
  }
  req.setSession(null); // remove session cookie
  // remove js-accessible cookie
  cookies.set(USER_ID_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    httpOnly: false,
    sameSite: 'strict',
    secure: dev ? false : true,
  });
}

export const googleAuth = google(auth, {
  clientId: AUTH_GOOGLE_CLIENT_ID,
  clientSecret: AUTH_GOOGLE_CLIENT_SECRET,
  redirectUri: APP_URL + '/api/users/google/callback',
  scope: ['email', 'profile'],
});

export type Auth = typeof auth;
