import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { renderMarkdown, getCheckboxProgress } from '@/utils/markdown';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useTaskTimer } from '@/features/task/hooks/useTaskTimer';
import { useTaskByCode } from '@/features/task/hooks/useTaskByCode';
import { useTaskData } from '@/features/task/hooks/useTaskData';
import { Play, Pause, Square, CheckCircle, Edit } from 'lucide-react';
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
import { RecurrenceModal } from '@/features/task/components/RecurrenceModal';

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


// Random background colors based on task code - darker tones for better text readability
const getRandomBackground = (taskCode: number) => {
  const backgrounds = [
    'bg-gradient-to-br from-slate-800 via-slate-900 to-black',
    'bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900',
    'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900',
    'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900',
    'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900',
    'bg-gradient-to-br from-teal-900 via-cyan-900 to-slate-900',
    'bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900',
    'bg-gradient-to-br from-neutral-900 via-gray-900 to-black',
    'bg-gradient-to-br from-stone-900 via-neutral-900 to-slate-900',
    'bg-gradient-to-br from-zinc-900 via-gray-900 to-black'
  ];
  
  // Use task code as seed for consistent but random selection
  const index = taskCode % backgrounds.length;
  return backgrounds[index];
};

export default function TaskRunPage() {
  const { taskCode } = useParams<{ taskCode: string }>();
  const navigate = useNavigate();

  // Get task data by taskCode first
  const { task: taskData, loading: taskLoading, error: taskError, refetch: refetchTask } = useTaskByCode(taskCode || '');
  
  // Get task editing functionality
  const {
    showRecurrenceModal,
    currentTask,
    modalMode,
    addTask,
    editTask,
    completeRecurrentTask,
    setShowRecurrenceModal,
    openEditModal
  } = useTaskData();

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
    taskId: taskData?.id || '', 
    onComplete: () => navigate(-1) 
  });

  // Use taskData from useTaskByCode as primary source
  const currentTaskData = taskData;

  const { body, checklist } = useMemo(() => 
    parseDescription(currentTaskData?.description || ''), 
    [currentTaskData?.description]
  );

  // Estado local para checklist con actualización optimista
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>([]);

  // Sincronizar estado local con taskData cuando cambie
  useEffect(() => {
    setLocalChecklist(checklist);
  }, [checklist]);

  const backgroundClass = useMemo(() => 
    getRandomBackground(currentTaskData?.taskCode || 0), 
    [currentTaskData?.taskCode]
  );


  const handleToggle = async (index: number) => {
    if (!currentTaskData?.id) return;
    
    // Actualización optimista inmediata del estado local
    const updated = localChecklist.map((c, i) => i === index ? { ...c, checked: !c.checked } : c);
    setLocalChecklist(updated);
    
    // Actualizar Firebase en background
    const newDesc = buildDescription(body, updated);
    await updateDoc(doc(db, 'tasks', currentTaskData.id), {
      description: newDesc,
      progress: getCheckboxProgress(newDesc)
    });
  };

  // Show loading state
  if (taskLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-xl">Cargando tarea...</p>
      </div>
    );
  }

  // Show error state
  if (taskError || !currentTaskData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Tarea no encontrada</h1>
          <p className="text-xl text-gray-300">
            {taskError || 'No se pudo encontrar la tarea solicitada'}
          </p>
          <Button variant="outline" className="text-white border-white hover:bg-white/20" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center ${backgroundClass} text-white p-6`}>
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="text-white hover:bg-white/20 text-lg font-semibold drop-shadow-lg px-6 py-3" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-lg font-mono font-semibold drop-shadow-lg bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
              #{currentTaskData.taskCode}
            </div>
            <div className="text-4xl font-mono font-bold drop-shadow-xl bg-black/30 px-6 py-2 rounded-lg backdrop-blur-sm border border-white/20">{formattedTime}</div>
          </div>
        </div>
        <h1 className="text-5xl font-bold break-words drop-shadow-xl text-center leading-tight">{currentTaskData?.title || ''}</h1>
        {body && (
          <div className="prose prose-xl max-w-none text-white drop-shadow-md prose-headings:drop-shadow-lg prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
        )}
        {localChecklist.length > 0 && (
          <div className="space-y-6">
            {localChecklist.map((item, i) => (
              <label key={i} className="flex items-center space-x-4 text-2xl bg-black/20 p-4 rounded-lg backdrop-blur-sm">
                <Checkbox checked={item.checked} onCheckedChange={() => handleToggle(i)} className="scale-125" />
                <span className="select-none drop-shadow-md font-medium">{item.text}</span>
              </label>
            ))}
          </div>
        )}
        
        {/* Timer Controls */}
        <div className="flex flex-col gap-6 mt-12">
          <div className="flex gap-4 justify-center">
            {!isActive ? (
              <Button 
                onClick={startTimer} 
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 text-xl font-semibold shadow-xl drop-shadow-lg border border-green-600"
              >
                <Play className="w-6 h-6 mr-3" />
                Iniciar
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button 
                    onClick={resumeTimer} 
                    className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 text-xl font-semibold shadow-xl drop-shadow-lg border border-green-600"
                  >
                    <Play className="w-6 h-6 mr-3" />
                    Reanudar
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseTimer} 
                    className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-xl font-semibold shadow-xl drop-shadow-lg border border-amber-500"
                  >
                    <Pause className="w-6 h-6 mr-3" />
                    Pausar
                  </Button>
                )}
                <Button 
                  onClick={stopTimer} 
                  className="bg-red-700 hover:bg-red-800 text-white px-8 py-4 text-xl font-semibold shadow-xl drop-shadow-lg border border-red-600"
                >
                  <Square className="w-6 h-6 mr-3" />
                  Detener
                </Button>
              </>
            )}
          </div>
          
          {/* Complete Task Button with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 text-xl font-semibold w-full shadow-xl drop-shadow-lg border border-blue-600"
              >
                <CheckCircle className="w-6 h-6 mr-3" />
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
          
          {/* Edit Task Button */}
          <Button 
            onClick={() => openEditModal(currentTaskData)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-4 text-xl font-semibold w-full shadow-xl drop-shadow-lg border border-gray-600"
          >
            <Edit className="w-6 h-6 mr-3" />
            Editar
          </Button>
        </div>
        
        {/* Edit Modal */}
        <RecurrenceModal
          isOpen={showRecurrenceModal}
          onClose={() => setShowRecurrenceModal()}
          onConfirm={async (data) => {
            if (modalMode === 'complete') {
              await completeRecurrentTask(data);
            } else if (modalMode === 'edit') {
              await editTask(currentTask!.id, data);
              // Refresh task data after editing to reflect changes
              refetchTask();
            } else {
              await addTask(data);
            }
          }}
          task={currentTask || currentTaskData || {
            id: '',
            taskCode: 0,
            title: '',
            completed: false,
            category: 'personal',
            createdAt: { seconds: Date.now() / 1000 }
          }}
          mode={modalMode}
        />
      </div>
    </div>
  );
}
