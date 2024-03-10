import forms from '@tailwindcss/forms';
import tailwindHighlightjs from 'tailwind-highlightjs';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
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
  plugins: [forms, tailwindHighlightjs],
};
