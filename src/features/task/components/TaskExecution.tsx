import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { renderMarkdown, getCheckboxProgress } from '@/utils/markdown';
import type { Task } from '../types';

interface TaskExecutionProps {
  taskId: string;
  onBack: () => void;
}

interface Subtask {
  text: string;
  checked: boolean;
  lineIndex: number;
  indent: string;
}

export const TaskExecution: React.FC<TaskExecutionProps> = ({ taskId, onBack }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ref = doc(db, 'tasks', taskId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const taskObj: Task = {
        id: snap.id,
        title: data.title,
        description: data.description || '',
        completed: data.completed,
        createdAt: data.createdAt,
        dueDate: data.dueDate?.toDate(),
        isRecurrent: data.isRecurrent || false,
        isPrivate: data.isPrivate || false,
        category: data.category || 'other',
        priority: data.priority,
        size: data.size,
        estimatedTime: data.estimatedTime,
        timeOfDay: data.timeOfDay,
        progress: data.progress,
        recurrence: data.recurrence
      };
      setTask(taskObj);
      parseDescription(taskObj.description || '');
    });
    return () => unsub();
  }, [taskId]);

  const parseDescription = (markdown: string) => {
    const allLines = markdown.split('\n');
    const st: Subtask[] = [];
    const descLines: string[] = [];
    allLines.forEach((line, idx) => {
      const match = line.match(/^(\s*)- \[( |x|X)\] (.*)$/);
      if (match) {
        st.push({
          text: match[3],
          checked: match[2].toLowerCase() === 'x',
          lineIndex: idx,
          indent: match[1] || ''
        });
      } else {
        descLines.push(line);
      }
    });
    setSubtasks(st);
    setLines(allLines);
    setDescriptionHtml(renderMarkdown(descLines.join('\n')));
  };

  const toggleSubtask = async (index: number) => {
    const st = subtasks[index];
    const newChecked = !st.checked;
    const newLines = [...lines];
    newLines[st.lineIndex] = `${st.indent}- [${newChecked ? 'x' : ' '}] ${st.text}`;
    const newMarkdown = newLines.join('\n');
    setLines(newLines);
    const newSubtasks = [...subtasks];
    newSubtasks[index] = { ...st, checked: newChecked };
    setSubtasks(newSubtasks);
    setDescriptionHtml(renderMarkdown(newMarkdown.split('\n').filter(l => !/^\s*- \[( |x|X)\]/.test(l)).join('\n')));
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        description: newMarkdown,
        progress: getCheckboxProgress(newMarkdown)
      });
    } catch (err) {
      console.error('Error updating subtask', err);
    }
  };

  const formatElapsed = () => {
    const m = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white p-4">
      <div className="self-start mb-4">
        <Button variant="ghost" onClick={onBack} className="text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-2 text-center w-full break-words">
        {task.title}
      </h1>
      <div className="text-xl font-mono mb-6">{formatElapsed()}</div>
      {descriptionHtml && (
        <div
          className="prose prose-invert max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      )}
      <div className="w-full max-w-xl space-y-4">
        {subtasks.map((sub, idx) => (
          <label
            key={idx}
            className="flex items-center gap-3 bg-white/10 p-4 rounded-lg"
          >
            <Checkbox
              checked={sub.checked}
              onCheckedChange={() => toggleSubtask(idx)}
              className="w-6 h-6 border-white"
            />
            <span className="text-lg break-words flex-1">{sub.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TaskExecution;
