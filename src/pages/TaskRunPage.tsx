import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { renderMarkdown, getCheckboxProgress } from '@/utils/markdown';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useTaskTimer } from '@/features/task/hooks/useTaskTimer';
import { Play, Pause, Square, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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


export default function TaskRunPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { body, checklist } = useMemo(() => parseDescription(description), [description]);

  const { 
    formattedTime, 
    isActive, 
    isPaused, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    stopTimer, 
    completeTask 
  } = useTaskTimer({ 
    taskId: taskId as string, 
    onComplete: () => navigate(-1) 
  });

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
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="text-white" onClick={() => navigate(-1)}>
            Volver
          </Button>
          <div className="text-2xl font-mono">{formattedTime}</div>
        </div>
        <h1 className="text-4xl font-bold break-words">{title}</h1>
        {body && (
          <div className="prose prose-lg max-w-none text-white" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
        )}
        {checklist.length > 0 && (
          <div className="space-y-4">
            {checklist.map((item, i) => (
              <label key={i} className="flex items-center space-x-3 text-xl">
                <Checkbox checked={item.checked} onCheckedChange={() => handleToggle(i)} />
                <span className="select-none">{item.text}</span>
              </label>
            ))}
          </div>
        )}
        
        {/* Timer Controls */}
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex gap-3 justify-center">
            {!isActive ? (
              <Button 
                onClick={startTimer} 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button 
                    onClick={resumeTimer} 
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Reanudar
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseTimer} 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 text-lg"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar
                  </Button>
                )}
                <Button 
                  onClick={stopTimer} 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Detener
                </Button>
              </>
            )}
          </div>
          
          {/* Complete Task Button with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg w-full"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Completar Tarea
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Completar Tarea</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres completar esta tarea? El timer se detendrá automáticamente y la tarea será marcada como completada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={completeTask}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sí, completar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
