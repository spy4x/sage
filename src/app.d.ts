// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
  namespace App {
    interface Locals {
      auth: import('lucia-auth').AuthRequest;
      user: import('@server').LuciaUser | null;
      session: import('lucia-auth').Session | null;
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}

/// <reference types="lucia-auth" />
declare global {
  namespace Lucia {
    type Auth = import('@server').Auth;
    type UserAttributes = {
      role?: import('@prisma/client').Role;
      email?: string;
      firstName?: string;
      lastName?: string;
      photoURL?: string;
      createdAt?: Date;
      updatedAt?: Date;
    };
  }
}

// THIS IS IMPORTANT!!!
export {};
