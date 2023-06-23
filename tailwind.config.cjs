import { join } from 'path';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import skeleton from '@skeletonlabs/skeleton/tailwind/skeleton.cjs';
import tailwindHighlightjs from 'tailwind-highlightjs';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
  ],
  safelist: [
    {
      pattern: /hljs+/, // for code highlighting
    },
  ],
  theme: {
    extend: {},
    hljs: {
      theme: 'github-dark', // for code highlighting
    },
  },
  plugins: [forms, typography, ...skeleton(), tailwindHighlightjs],
};
