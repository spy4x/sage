import { z } from 'zod';

const ApiConfigSchema = z.object({
  appURL: z.string(),
});

export const API_CONFIG = ApiConfigSchema.parse({
  appURL: '', // will be set dynamically in "src/hooks.server.ts" on first request
});
