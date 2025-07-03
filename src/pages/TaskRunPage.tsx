import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { renderMarkdown, getCheckboxProgress } from '@/utils/markdown';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface ChecklistItem {
  text: string;
  checked: boolean;
}

const parseDescription = (markdown: string) => {
  const lines = markdown.split('\n');
  const bodyLines: string[] = [];
  const checklist: ChecklistItem[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*- \[( |x|X)\] ?(.*)/);
    if (match) {
      checklist.push({ text: match[2], checked: match[1].toLowerCase() === 'x' });
    } else {
      bodyLines.push(line);
    }
  }
  return { body: bodyLines.join('\n'), checklist };
};

const buildDescription = (body: string, checklist: ChecklistItem[]) => {
  const bodyLines = body ? body.split('\n') : [];
  const checklistLines = checklist.map(i => `- [${i.checked ? 'x' : ' '}] ${i.text}`);
  return [...bodyLines, ...checklistLines].join('\n').trim();
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [h, m, s].map(t => String(t).padStart(2, '0'));
  return parts.join(':');
};

export default function TaskRunPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const { body, checklist } = useMemo(() => parseDescription(description), [description]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'tasks', taskId as string), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || '');
        setDescription(data.description || '');
      }
    });
    return () => unsub();
  }, [taskId]);

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = async (index: number) => {
    const updated = checklist.map((c, i) => i === index ? { ...c, checked: !c.checked } : c);
    const newDesc = buildDescription(body, updated);
    setDescription(newDesc);
    await updateDoc(doc(db, 'tasks', taskId as string), {
      description: newDesc,
      progress: getCheckboxProgress(newDesc)
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center gradient-bg-secondary text-white p-6">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="text-white" onClick={() => navigate(-1)}>
            Volver
          </Button>
          <div className="text-lg font-mono">{formatTime(elapsed)}</div>
        </div>
        <h1 className="text-3xl font-bold break-words">{title}</h1>
        {body && (
          <div className="prose prose-sm max-w-none text-white" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
        )}
        {checklist.length > 0 && (
          <div className="space-y-4">
            {checklist.map((item, i) => (
              <label key={i} className="flex items-center space-x-3 text-lg">
                <Checkbox checked={item.checked} onCheckedChange={() => handleToggle(i)} />
                <span className="select-none">{item.text}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
