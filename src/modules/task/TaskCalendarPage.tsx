// src/pages/TaskCalendarPage.tsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, Plus, Upload, Download, Brain } from 'lucide-react';
import { TaskWeeklyCalendar } from '@/modules/task/components/TaskWeeklyCalendar';
import { TaskAiSuggestion, TaskAiReprioritize, TaskDetailsModal } from '@/modules/task/components';
import RecurrenceModal from '@/modules/task/components/RecurrenceModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTaskData } from '@/modules/task/controllers/useTaskData.supabase';
import { Task, TaskCategory, CATEGORY_LABELS, TASK_CATEGORIES } from '@/modules/task/models';
import { CompactTaskHeader } from '@/shared/components/navigation/CompactTaskHeader';
import { cn } from '@/lib/utils';
import { adjustEndDateToStartDate } from '@/shared/utils/dates';

const TaskCalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [showAiReprioritize, setShowAiReprioritize] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { user } = useAuth();
  const taskData = useTaskData();
  const {
    tasks,
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
    error,
  } = taskData;

  // Get search query from URL params
  const searchQuery = searchParams.get('search') || '';

  // Parse categories from URL (comma-separated)
  const selectedCategories = React.useMemo(() => {
    const categoriesParam = searchParams.get('categories');
    if (!categoriesParam) return [];
    return categoriesParam.split(',').filter(c =>
      Object.values(TASK_CATEGORIES).includes(c as TaskCategory)
    ) as TaskCategory[];
  }, [searchParams]);

  // Update URL when search changes
  const handleSearchChange = (query: string) => {
    const newParams: Record<string, string> = {};

    if (query.trim()) {
      newParams.search = query;
    }

    // Preserve categories if they exist
    if (selectedCategories.length > 0) {
      newParams.categories = selectedCategories.join(',');
    }

    setSearchParams(Object.keys(newParams).length > 0 ? newParams : {});
  };

  // Update URL when categories change
  const handleCategoriesChange = (categories: TaskCategory[]) => {
    const newParams: Record<string, string> = {};

    // Preserve search if exists
    if (searchQuery.trim()) {
      newParams.search = searchQuery;
    }

    // Add categories only if any are selected
    if (categories.length > 0) {
      newParams.categories = categories.join(',');
    }

    setSearchParams(Object.keys(newParams).length > 0 ? newParams : {});
  };

  // Filter tasks based on URL parameters (categories and search)
  const filteredTasks = React.useMemo(() => {
    // First filter by categories (if any are selected)
    let filtered = selectedCategories.length > 0
      ? tasks.filter(task => selectedCategories.includes(task.category))
      : tasks;

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [tasks, selectedCategories, searchQuery]);

  if (!user) {
    return (
      <div className="min-h-screen p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/task')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Calendario de Tareas</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p>Inicia sesión para ver tu calendario de tareas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleNewTask = () => {
    openCreateModal();
  };

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
      
      tasksToImport.forEach((taskData: Record<string, unknown>) => {
        if (typeof taskData.title === 'string') {
          let startDate = undefined;
          let endDate = undefined;

          // Migración: soportar tanto dueDate (legacy) como startDate
          if (taskData.startDate || taskData.dueDate) {
            const dateStr = (taskData.startDate || taskData.dueDate) as string;
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              startDate = parsedDate;
            } else {
              invalidDatesCount++;
              console.warn(`Fecha inválida para tarea "${taskData.title}": ${dateStr}`);
            }
          }

          if (taskData.endDate) {
            const parsedDate = new Date(taskData.endDate as string);
            if (!isNaN(parsedDate.getTime())) {
              endDate = parsedDate;
            } else {
              invalidDatesCount++;
              console.warn(`Fecha de fin inválida para tarea "${taskData.title}": ${taskData.endDate}`);
            }
          }

          addTask({
            title: taskData.title,
            description: (taskData.description as string) || '',
            startDate: startDate,
            endDate: endDate,
            category: (taskData.category as 'personal' | 'work' | 'health') || 'personal',
            priority: taskData.priority as 'do' | 'decide' | 'delegate' | 'delete' || undefined,
            isPrivate: false,
            isRecurrent: Boolean(taskData.isRecurrent) || false,
            size: taskData.size as 'pequeña' | 'mediana' | 'grande' || undefined
          });
          importedCount++;
        }
      });

      if (invalidDatesCount > 0) {
        toast.warning(`${importedCount} tareas importadas. ${invalidDatesCount} fechas inválidas fueron omitidas.`);
      } else {
        toast.success(`${importedCount} tareas importadas correctamente`);
      }
      
      setImportJson('');
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Error al importar las tareas. Verifica el formato JSON.');
      console.error('Error de importación:', error);
    }
  };

  const handleExportTasks = () => {
    const exportData = tasks.map(task => ({
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

  // Define actions for the header
  const calendarActions = [
    {
      id: 'back',
      label: 'Volver',
      icon: <ArrowLeft className="h-4 w-4" />,
      onClick: () => navigate('/task/list'),
      tooltip: 'Volver a tareas'
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
      onClick: handleNewTask,
      tooltip: 'Crear nueva tarea',
      className: 'bg-black text-white hover:bg-gray-800',
      showLabel: true
    }
  ];

  const handleTabChange = (tab: string) => {
    if (tab === 'list') {
      navigate('/task/list');
    } else if (tab === 'kanban') {
      navigate('/task/kanban');
    } else if (tab === 'week') {
      navigate('/task/calendar');
    } else if (tab === 'analytics') {
      navigate('/task/list'); // Analytics is part of list view
    }
  };

  // Generate header title based on active filters
  const getHeaderTitle = () => {
    const filters: string[] = [];

    if (searchQuery) filters.push(`"${searchQuery}"`);

    if (selectedCategories.length > 0) {
      const categoryLabels = selectedCategories
        .map(cat => CATEGORY_LABELS[cat])
        .join(', ');
      filters.push(categoryLabels);
    }

    if (filters.length > 0) {
      return `Calendario - ${filters.join(' | ')}`;
    }
    return "Calendario de Tareas";
  };

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <CompactTaskHeader
        title={getHeaderTitle()}
        actions={calendarActions}
        currentTab="week"
        onTabChange={handleTabChange}
      />

      {/* FAB - Floating Action Button (mobile only) */}
      <Button
        onClick={handleNewTask}
        className={cn(
          "fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl",
          "transition-shadow z-50 lg:hidden bg-black text-white hover:bg-gray-800"
        )}
        size="icon"
        title="Crear nueva tarea"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <div className="p-4">
        {/* Error Handler */}
        {error && (
          <div className="mb-4 text-sm text-red-500 p-2">
            {error}
          </div>
        )}

        {/* Calendar */}
        <Card>
          <CardContent className="p-6">
            <TaskWeeklyCalendar
              tasks={filteredTasks}
              onDelete={deleteTask}
              onEdit={openEditModal}
              onToggle={toggleTask}
              onQuickUpdate={(task) => {
                // Actualización rápida de duración sin abrir modal
                editTask(task.id, { endDate: task.endDate });
              }}
              onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
              onMove={(id, startDate) => {
                // Encontrar la tarea actual para obtener sus fechas originales
                const task = tasks.find(t => t.id === id);
                if (!task) return;

                // Si se está quitando la fecha (startDate es null)
                if (!startDate) {
                  editTask(id, { startDate: undefined, endDate: undefined });
                  return;
                }

                // Calcular la nueva endDate preservando la duración original
                const newEndDate = adjustEndDateToStartDate(
                  task.startDate,
                  task.endDate,
                  startDate
                );

                // Actualizar ambas fechas
                editTask(id, {
                  startDate,
                  endDate: newEndDate
                });
              }}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              selectedCategories={selectedCategories}
              onCategoriesChange={handleCategoriesChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Components */}
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

      {/* Recurrence Modal */}
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

      {/* Import Tasks Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Importar Tareas</DialogTitle>
            <DialogDescription>
              Pega el JSON con las tareas a importar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Pega aquí el JSON con las tareas a importar..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={10}
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

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={detailTask}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={(t) => { setShowDetailModal(false); openEditModal(t); }}
        onToggle={toggleTask}
      />
    </div>
  );
};

export default TaskCalendarPage;