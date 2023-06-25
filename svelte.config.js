import adapter from 'svelte-kit-sst';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      '@stores': './src/lib/client/stores',
      '@components': './src/lib/client/components',
      '@shared': './src/lib/shared',
      '@client/services': './src/lib/client/services',
      '@server': './src/lib/server',
    },
  },
};

export default config;
