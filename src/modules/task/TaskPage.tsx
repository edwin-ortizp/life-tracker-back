// src/pages/TaskPage.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Brain, CheckSquare, Download, Plus, Settings, Upload } from 'lucide-react';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/shared/components/module-views/types';
import { taskDefaultViewKey, taskViews, type TaskViewKey } from '@/modules/task/views';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTaskData } from '@/modules/task/controllers/useTaskData.supabase';
import { useTaskKeyboardShortcuts } from '@/modules/task/controllers/useTaskKeyboardShortcuts';
import {
  PriorityLegend,
  TaskAiReprioritize,
  TaskAiSuggestion,
  TaskDetailsModal,
  TaskKanban,
  TaskList,
  TaskWeeklyCalendar
} from '@/modules/task/components';
import RecurrenceModal from '@/modules/task/components/RecurrenceModal';
import { Task, TaskCategory, TASK_CATEGORIES } from '@/modules/task/models';
import { adjustEndDateToStartDate } from '@/shared/utils/dates';

type TaskStatus = 'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error';

type TaskViewProps = {
  tasks: Task[];
  status: TaskStatus;
  error: string | null;
  addTask: (data: any) => void;
  editTask: (taskId: string, updates: any) => void;
  deleteTask: (taskId: string) => void;
  toggleTask: (taskId: string, completed: boolean) => void;
  openEditModal: (task: Task) => void;
  openCreateModal: (due?: Date) => void;
  onViewTask: (task: Task) => void;
  taskStats: any[];
  completionStats: any[];
};

const getTaskTimeParts = (date?: Date) => {
  if (!date) {
    return { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 };
  }

  const hasTime =
    date.getHours() !== 0 ||
    date.getMinutes() !== 0 ||
    date.getSeconds() !== 0 ||
    date.getMilliseconds() !== 0;

  if (!hasTime) {
    return { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 };
  }

  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    milliseconds: date.getMilliseconds()
  };
};

const buildStartDate = (task: Task, targetDate: Date) => {
  const nextStart = new Date(targetDate);
  const time = getTaskTimeParts(task.startDate);
  nextStart.setHours(time.hours, time.minutes, time.seconds, time.milliseconds);
  return nextStart;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TaskListView: React.FC<TaskViewProps> = ({
  tasks,
  status,
  error,
  editTask,
  deleteTask,
  openEditModal,
  onViewTask
}) => (
  <Card>
    <CardContent className="pt-6">
      <TaskList
        tasks={tasks}
        onDelete={deleteTask}
        onEdit={openEditModal}
        onView={onViewTask}
        onMove={(id, startDate) => {
          const task = tasks.find((item) => item.id === id);
          if (!task) return;

          if (!startDate) {
            editTask(id, { startDate: undefined, endDate: undefined });
            return;
          }

          const newEndDate = adjustEndDateToStartDate(
            task.startDate,
            task.endDate,
            startDate
          );

          editTask(id, {
            startDate,
            endDate: newEndDate,
          });
        }}
        onAssignTimeOfDay={(id, timeOfDay) => editTask(id, { timeOfDay })}
        status={status}
        error={error || undefined}
      />
      {error && (
        <div className="text-sm text-red-500 p-2">
          {error}
        </div>
      )}
    </CardContent>
  </Card>
);

const TaskKanbanView: React.FC<TaskViewProps> = ({
  tasks,
  error,
  editTask,
  deleteTask,
  openEditModal,
  openCreateModal,
  onViewTask
}) => {
  const handleMove = (id: string, targetDate: Date | null) => {
    if (!targetDate) {
      editTask(id, { startDate: undefined, endDate: undefined });
      return;
    }

    const task = tasks.find((item) => item.id === id);
    if (!task) {
      editTask(id, { startDate: targetDate });
      return;
    }

    const newStartDate = buildStartDate(task, targetDate);
    const duration =
      task.startDate && task.endDate ? task.endDate.getTime() - task.startDate.getTime() : 0;
    const safeDuration = duration > 0 ? duration : 0;
    let newEndDate = new Date(newStartDate.getTime() + safeDuration);
    if (newEndDate.getTime() < newStartDate.getTime()) {
      newEndDate = new Date(newStartDate);
    }

    editTask(id, {
      startDate: newStartDate,
      endDate: newEndDate
    });
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardContent className="pt-6 overflow-x-auto">
          <TaskKanban
            tasks={tasks}
            onDelete={deleteTask}
            onEdit={openEditModal}
            onView={onViewTask}
            onMove={handleMove}
            onAdd={(due) => openCreateModal(due ?? undefined)}
            onFilteredTasksChange={() => {}}
          />
          {error && (
            <p className="text-sm text-red-500 mt-4">{error}</p>
          )}
        </CardContent>
      </Card>
      <PriorityLegend />
    </div>
  );
};

const TaskCalendarView: React.FC<TaskViewProps> = ({
  tasks,
  editTask,
  deleteTask,
  toggleTask,
  openEditModal,
  onViewTask,
  error
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('search') || '';

  const selectedCategories = React.useMemo(() => {
    const categoriesParam = searchParams.get('categories');
    if (!categoriesParam) return [];
    return categoriesParam.split(',').filter((category) =>
      Object.values(TASK_CATEGORIES).includes(category as TaskCategory)
    ) as TaskCategory[];
  }, [searchParams]);

  const handleSearchChange = (query: string) => {
    const newParams: Record<string, string> = {};

    if (query.trim()) {
      newParams.search = query;
    }

    if (selectedCategories.length > 0) {
      newParams.categories = selectedCategories.join(',');
    }

    setSearchParams(Object.keys(newParams).length > 0 ? newParams : {});
  };

  const handleCategoriesChange = (categories: TaskCategory[]) => {
    const newParams: Record<string, string> = {};

    if (searchQuery.trim()) {
      newParams.search = searchQuery;
    }

    if (categories.length > 0) {
      newParams.categories = categories.join(',');
    }

    setSearchParams(Object.keys(newParams).length > 0 ? newParams : {});
  };

  const filteredTasks = React.useMemo(() => {
    let filtered = selectedCategories.length > 0
      ? tasks.filter((task) => selectedCategories.includes(task.category))
      : tasks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [tasks, selectedCategories, searchQuery]);

  return (
    <Card>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 text-sm text-red-500 p-2">
            {error}
          </div>
        )}
        <TaskWeeklyCalendar
          tasks={filteredTasks}
          onDelete={deleteTask}
          onEdit={openEditModal}
          onToggle={toggleTask}
          onQuickUpdate={(task) => {
            editTask(task.id, { endDate: task.endDate });
          }}
          onView={onViewTask}
          onMove={(id, startDate) => {
            const task = tasks.find((item) => item.id === id);
            if (!task) return;

            if (!startDate) {
              editTask(id, { startDate: undefined, endDate: undefined });
              return;
            }

            const newEndDate = adjustEndDateToStartDate(
              task.startDate,
              task.endDate,
              startDate
            );

            editTask(id, {
              startDate,
              endDate: newEndDate,
            });
          }}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategories={selectedCategories}
          onCategoriesChange={handleCategoriesChange}
        />
      </CardContent>
    </Card>
  );
};

const TaskAnalyticsView: React.FC<TaskViewProps> = ({ taskStats, completionStats }) => (
  <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 desktop-grid-responsive">
    <Card className="desktop-card-enhanced">
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">Progreso de Tareas</h3>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={taskStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completadas"
                stroke="#8884d8"
              />
              <Line
                type="monotone"
                dataKey="pending"
                name="Pendientes"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    <Card className="desktop-card-enhanced">
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">Estado General</h3>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={completionStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({
                  cx = 0,
                  cy = 0,
                  midAngle = 0,
                  innerRadius = 0,
                  outerRadius = 0,
                  percent = 0,
                  name
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#888"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {`${name} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
              >
                {completionStats.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </div>
);

const TaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: TaskViewKey }>();
  const resolvedViewKey = (viewKey || taskDefaultViewKey) as TaskViewKey;
  const { user } = useAuth();
  const [taskStats, setTaskStats] = useState<any[]>([]);
  const [completionStats, setCompletionStats] = useState<any[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [showAiReprioritize, setShowAiReprioritize] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const taskData = useTaskData();
  const {
    tasks,
    status,
    error,
    showRecurrenceModal,
    currentTask,
    modalMode,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    completeRecurrentTask,
    setShowRecurrenceModal,
    openCreateModal,
    openEditModal,
  } = taskData;

  useTaskKeyboardShortcuts({
    openCreateModal,
    isModalOpen: showRecurrenceModal || showDetailModal
  });

  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setTaskStats([]);
      setCompletionStats([]);
      return;
    }

    const recentTasks = tasks.slice(0, 100);
    const dailyStats = recentTasks.reduce((acc: any, task) => {
      const date = task.createdAt
        ? new Date(task.createdAt.seconds * 1000).toISOString().split('T')[0]
        : 'unknown';
      if (!acc[date]) {
        acc[date] = { date, completed: 0, pending: 0 };
      }
      acc[date][task.completed ? 'completed' : 'pending']++;
      return acc;
    }, {});

    setTaskStats(Object.values(dailyStats));

    const totalCompleted = tasks.filter((task) => task.completed).length;
    const totalPending = tasks.filter((task) => !task.completed).length;

    setCompletionStats([
      { name: 'Completadas', value: totalCompleted },
      { name: 'Pendientes', value: totalPending }
    ]);
  }, [tasks]);

  const taskViewRegistry: Array<ModuleViewDefinition<TaskViewProps>> = taskViews.map((view) => ({
    ...view,
    component: view.key === 'list'
      ? TaskListView
      : view.key === 'kanban'
      ? TaskKanbanView
      : view.key === 'calendar'
      ? TaskCalendarView
      : TaskAnalyticsView
  }));

  const activeView = taskViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={`/task/view/${taskDefaultViewKey}`} replace />;
  }

  if (!user) {
    return (
      <ModuleViewLayout
        title="Tareas"
        icon={<CheckSquare className="h-4 w-4 text-white" />}
      >
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold">Inicia sesion para ver tus tareas</h2>
            </CardContent>
          </Card>
        </div>
      </ModuleViewLayout>
    );
  }

  const handleImportTasks = () => {
    setShowImportDialog(true);
  };

  const handleImportTasksConfirm = () => {
    try {
      const tasksToImport = JSON.parse(importJson);

      if (!Array.isArray(tasksToImport)) {
        toast.error('El JSON debe contener un array de tareas');
        return;
      }

      let importedCount = 0;
      let invalidDatesCount = 0;

      tasksToImport.forEach((taskData: Record<string, any>) => {
        if (typeof taskData.title === 'string') {
          let startDate = undefined;
          let endDate = undefined;

          if (taskData.startDate || taskData.dueDate) {
            const dateStr = (taskData.startDate || taskData.dueDate) as string;
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              startDate = parsedDate;
            } else {
              invalidDatesCount++;
              console.warn(`Fecha invalida para tarea "${taskData.title}": ${dateStr}`);
            }
          }

          if (taskData.endDate) {
            const parsedDate = new Date(taskData.endDate as string);
            if (!isNaN(parsedDate.getTime())) {
              endDate = parsedDate;
            } else {
              invalidDatesCount++;
              console.warn(`Fecha de fin invalida para tarea "${taskData.title}": ${taskData.endDate}`);
            }
          }

          addTask({
            title: taskData.title,
            description: taskData.description || '',
            startDate,
            endDate,
            category: (taskData.category as 'personal' | 'work' | 'health') || 'personal',
            priority: taskData.priority as 'do' | 'decide' | 'delegate' | 'delete' || undefined,
            isPrivate: false,
            isRecurrent: Boolean(taskData.isRecurrent) || false,
            size: taskData.size === 'pequena'
              ? 'pequeña'
              : (taskData.size as 'pequeña' | 'mediana' | 'grande' | undefined),
          });
          importedCount++;
        }
      });

      if (invalidDatesCount > 0) {
        toast.warning(`${importedCount} tareas importadas. ${invalidDatesCount} fechas invalidas fueron omitidas.`);
      } else {
        toast.success(`${importedCount} tareas importadas correctamente`);
      }

      setImportJson('');
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Error al importar las tareas. Verifica el formato JSON.');
      console.error('Error de importacion:', error);
    }
  };

  const handleExportTasks = () => {
    const exportData = tasks.map((task) => ({
      title: task.title,
      description: task.description || '',
      startDate: task.startDate?.toISOString() || null,
      endDate: task.endDate?.toISOString() || null,
      category: task.category,
      priority: task.priority || null,
      isRecurrent: task.isRecurrent || false,
      size: task.size || null,
      completed: task.completed
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tareas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Tareas exportadas correctamente');
  };

  const taskActions: ModuleViewAction[] = [
    {
      id: 'config',
      label: 'Configuracion',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate('/task/config'),
      tooltip: 'Configuracion'
    },
    {
      id: 'import',
      label: 'Importar',
      icon: <Upload className="h-4 w-4" />,
      onClick: handleImportTasks,
      tooltip: 'Importar tareas'
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: <Download className="h-4 w-4" />,
      onClick: handleExportTasks,
      tooltip: 'Exportar tareas'
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      icon: <Brain className="h-4 w-4" />,
      onClick: () => {},
      tooltip: 'Asistente IA',
      dropdown: [
        {
          label: 'Sugerir tareas',
          onClick: () => setShowAiSuggestion(true)
        },
        {
          label: 'Repriorizar visibles',
          onClick: () => setShowAiReprioritize(true)
        }
      ]
    },
    {
      id: 'new',
      label: 'Nuevo',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => openCreateModal(),
      tooltip: 'Crear nueva tarea',
      className: 'bg-black text-white hover:bg-gray-800',
      showLabel: true
    }
  ];

  const ActiveView = activeView.component;

  const viewProps: TaskViewProps = {
    tasks,
    status,
    error,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    openEditModal,
    openCreateModal,
    onViewTask: (task) => {
      setDetailTask(task);
      setShowDetailModal(true);
    },
    taskStats,
    completionStats,
  };

  return (
    <ModuleViewLayout
      title="Tareas"
      icon={<CheckSquare className="h-4 w-4 text-white" />}
      views={taskViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(`/task/view/${key}`)}
      actions={taskActions}
    >
      <div className="p-4 space-y-4">
        <ActiveView {...viewProps} />
      </div>

      <Button
        onClick={() => openCreateModal()}
        className={cn(
          'fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl',
          'transition-shadow z-50 lg:hidden bg-black text-white hover:bg-gray-800'
        )}
        size="icon"
        title="Crear nueva tarea"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TaskAiSuggestion
        tasks={tasks}
        open={showAiSuggestion}
        onOpenChange={setShowAiSuggestion}
      />
      <TaskAiReprioritize
        tasks={tasks}
        onUpdate={editTask}
        open={showAiReprioritize}
        onOpenChange={setShowAiReprioritize}
      />

      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal()}
        onConfirm={(data) => {
          if (modalMode === 'complete') {
            completeRecurrentTask(data);
          } else if (modalMode === 'edit') {
            editTask(currentTask!.id, data);
          } else {
            addTask(data);
          }
        }}
        task={currentTask || {
          id: '',
          taskCode: 0,
          title: '',
          completed: false,
          category: 'personal',
          createdAt: { seconds: Date.now() / 1000 }
        }}
        mode={modalMode}
      />

      <TaskDetailsModal
        task={detailTask}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={(task) => {
          setShowDetailModal(false);
          openEditModal(task);
        }}
        onToggle={toggleTask}
      />

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Importar Tareas</DialogTitle>
            <DialogDescription>
              Pega el JSON con las tareas a importar. Puedes incluir fechas en varios formatos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={`Ejemplo - Importa tareas con fechas en diferentes formatos:
[
  {
    "title": "Completar proyecto importante",
    "description": "Terminar la implementacion",
    "dueDate": "2024-12-31",
    "category": "work",
    "priority": "do",
    "size": "grande"
  },
  {
    "title": "Revision medica anual",
    "description": "Chequeo general de salud",
    "startDate": "2024-07-15T09:00:00Z",
    "category": "health",
    "priority": "decide"
  }
]

Formatos de fecha soportados:
- "2024-12-31" (solo fecha)
- "2024-06-15T14:30:00Z" (fecha y hora ISO)
- "2024-06-15T14:30:00" (fecha y hora local)
- Sin campo "startDate" o "dueDate" = sin fecha asignada
`}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={18}
              className="font-mono text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleImportTasksConfirm} disabled={!importJson.trim()}>
                Importar Tareas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleViewLayout>
  );
};

export default TaskPage;
