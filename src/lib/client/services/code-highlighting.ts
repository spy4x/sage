import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({
  highlight: function (code: string, language: string) {
    if (!language) {
      return hljs.highlightAuto(code).value;
    }
    try {
      return hljs.highlight(code, { language }).value;
    } catch (e) {
      return hljs.highlightAuto(code).value;
    }
  },
});

export function markdown(text: string): string {
  return marked(text);
}
