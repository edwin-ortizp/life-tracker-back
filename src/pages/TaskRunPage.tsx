import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square } from 'lucide-react';
import { useTaskData } from '@/features/task/hooks/useTaskData.supabase';

const formatElapsedTime = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
};

export default function TaskRunPage() {
  const { taskCode } = useParams<{ taskCode: string }>();
  const navigate = useNavigate();
  const { allTasks, editTask } = useTaskData();
  const numericTaskCode = Number(taskCode);

  const task = useMemo(
    () => allTasks.find((item) => item.taskCode === numericTaskCode),
    [allTasks, numericTaskCode]
  );

  const [baseSeconds, setBaseSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

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

  if (!task || Number.isNaN(numericTaskCode)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      <div className="text-center space-y-6">
        <h1 className="text-3xl font-semibold">{task.title}</h1>
        <div className="text-5xl font-mono font-bold bg-black/40 px-6 py-3 rounded-lg">
          {formatElapsedTime(getDisplaySeconds())}
        </div>
        <div className="flex items-center justify-center gap-3">
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
    </div>
  );
}
