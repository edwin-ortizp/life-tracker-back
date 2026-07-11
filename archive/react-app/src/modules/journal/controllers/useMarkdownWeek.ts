import { useState, useEffect } from 'react';

interface JournalEntry {
  day: string;
  text: string;
}

const markdownFiles = import.meta.glob('../markdown/*.md', { query: '?raw', import: 'default' });

const parseMarkdown = (content: string): JournalEntry[] => {
  const regex = /^###\s*(.+)\n([\s\S]*?)(?=^###\s*|$)/gm;
  const entries: JournalEntry[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    entries.push({
      day: match[1].trim(),
      text: match[2].trim()
    });
  }
  return entries;
};

export const useMarkdownWeek = (slug: string) => {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);

  useEffect(() => {
    const path = `../markdown/${slug}.md`;
    const loader = (markdownFiles as Record<string, () => Promise<string>>)[path];
    if (!loader) {
      setEntries(null);
      return;
    }
    loader().then(content => {
      setEntries(parseMarkdown(content));
    });
  }, [slug]);

  return entries;
};
