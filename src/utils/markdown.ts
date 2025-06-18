// src/utils/markdown.ts
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export const renderMarkdown = (markdown: string): string => {
  try {
    const html = marked.parse(markdown);
    return DOMPurify.sanitize(html as string);
  } catch {
    return DOMPurify.sanitize(markdown.replace(/\n/g, '<br>'));
  }
};

export const getCheckboxProgress = (markdown: string): number => {
  const matches = markdown.match(/^\s*- \[(?: |x|X)\]/gm);
  if (!matches || matches.length === 0) return 0;
  const checked = matches.filter(m => m.toLowerCase().startsWith('- [x]')).length;
  return (checked / matches.length) * 100;
};
