import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowLeft, Play, Square } from 'lucide-react';
import { useTaskData } from '@/modules/task/controllers/useTaskData.supabase';
import { Progress } from '@/shared/components/ui/progress';
import { renderMarkdown, getCheckboxStats, getCheckboxProgress } from '@/shared/utils/markdown';
import { CATEGORY_LABELS } from '@/modules/task/models';

const formatElapsedTime = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
};

export default function TaskRunPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { allTasks, editTask } = useTaskData();
  const resolvedTaskId = taskId ?? '';

  const task = useMemo(
    () => allTasks.find((item) => item.id === resolvedTaskId),
    [allTasks, resolvedTaskId]
  );

  const [localDescription, setLocalDescription] = useState('');
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);
  const [baseSeconds, setBaseSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    setLocalDescription(task?.description || '');
  }, [task?.id, task?.description]);

  useEffect(() => {
    if (!isRunning) {
      setBaseSeconds(task?.elapsedSeconds ?? 0);
    }
  }, [task, isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const getDisplaySeconds = () => {
    if (!isRunning || startTimeMs === null) return baseSeconds;
    const deltaSeconds = Math.floor((nowMs - startTimeMs) / 1000);
    return baseSeconds + Math.max(0, deltaSeconds);
  };

  const handleStart = () => {
    if (isRunning) return;
    setStartTimeMs(Date.now());
    setNowMs(Date.now());
    setIsRunning(true);
  };

  const handleStop = async () => {
    if (!isRunning || startTimeMs === null || !task) return;
    const deltaSeconds = Math.floor((Date.now() - startTimeMs) / 1000);
    const totalSeconds = baseSeconds + Math.max(0, deltaSeconds);
    setBaseSeconds(totalSeconds);
    setIsRunning(false);
    setStartTimeMs(null);
    await editTask(task.id, { elapsedSeconds: totalSeconds });
  };

  const backgroundClass = useMemo(() => {
    const backgrounds = [
      'bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900',
      'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900',
      'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900',
      'bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900',
      'bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900',
      'bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900',
      'bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900',
      'bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900',
      'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900',
      'bg-gradient-to-br from-green-900 via-emerald-900 to-slate-900',
    ];
    const seed = task?.taskCode ?? task?.title.length ?? 0;
    return backgrounds[seed % backgrounds.length];
  }, [task?.taskCode, task?.title.length]);

  const checklistItems = useMemo(() => {
    if (!localDescription) return [];
    return localDescription
      .split('\n')
      .map((line, index) => {
        const match = line.match(/^\s*-\s\[( |x|X)\]\s(.*)$/);
        if (!match) return null;
        return {
          index,
          checked: match[1].toLowerCase() === 'x',
          text: match[2]
        };
      })
      .filter((item): item is { index: number; checked: boolean; text: string } => !!item);
  }, [localDescription]);

  const descriptionWithoutChecklist = useMemo(() => {
    if (!localDescription) return '';
    return localDescription
      .split('\n')
      .filter((line) => !/^\s*-\s\[( |x|X)\]\s/.test(line))
      .join('\n')
      .trim();
  }, [localDescription]);

  const { total, checked } = getCheckboxStats(localDescription || '');
  const hasCheckboxes = total > 0;
  const progress = hasCheckboxes ? getCheckboxProgress(localDescription || '') : 0;
  const descriptionHtml = renderMarkdown(descriptionWithoutChecklist);

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Tarea no encontrada</h1>
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-gray-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const handleToggleChecklist = async (lineIndex: number) => {
    if (!task) return;
    const lines = localDescription.split('\n');
    const line = lines[lineIndex] ?? '';
    const match = line.match(/^\s*-\s\[( |x|X)\]\s/);
    if (!match) return;
    const nextMark = match[1].toLowerCase() === 'x' ? ' ' : 'x';
    lines[lineIndex] = line.replace(/\[( |x|X)\]/, `[${nextMark}]`);
    const nextDescription = lines.join('\n');
    setLocalDescription(nextDescription);
    setIsSavingChecklist(true);
    try {
      await editTask(task.id, { description: nextDescription });
    } finally {
      setIsSavingChecklist(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${backgroundClass} text-white`}>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 text-lg font-semibold drop-shadow-lg px-6 py-3"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <div className="text-sm font-mono text-white/70 drop-shadow-lg">
            #{task.taskCode}
          </div>
        </div>

        <div className="text-center mt-10 mb-8">
          <div className="text-6xl font-mono font-bold drop-shadow-xl bg-black/30 px-6 py-3 rounded-lg backdrop-blur-sm border border-white/20 inline-block">
            {formatElapsedTime(getDisplaySeconds())}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              onClick={handleStart}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isRunning}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Detener
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold drop-shadow-xl mb-2">{task.title}</h1>
          <p className="text-lg text-white/80 drop-shadow-lg">
            {CATEGORY_LABELS[task.category]}
          </p>
        </div>

        <div className="flex-1">
          {localDescription ? (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mx-auto max-w-3xl space-y-4">
              <h2 className="text-2xl font-semibold drop-shadow-lg text-center">
                Detalle y subtareas
              </h2>
              {checklistItems.length > 0 && (
                <div className="space-y-3">
                  {checklistItems.map((item) => (
                    <div
                      key={item.index}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                        item.checked ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => handleToggleChecklist(item.index)}
                        className="border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-black"
                      />
                      <span className={`text-sm ${item.checked ? 'line-through text-white/60' : 'text-white/90'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="prose prose-invert prose-sm max-w-none text-white/90"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
              {hasCheckboxes && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Progreso de subtareas</span>
                    <span>{checked} de {total} completadas ({Math.round(progress)}%)</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {isSavingChecklist && (
                    <div className="text-xs text-white/70">Guardando\u2026</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mx-auto max-w-3xl text-center text-white/70">
              Esta tarea no tiene descripci\u00f3n ni subtareas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
