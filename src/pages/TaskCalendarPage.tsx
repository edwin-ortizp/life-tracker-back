// src/pages/TaskCalendarPage.tsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Upload, Download, Brain } from 'lucide-react';
import { TaskWeeklyCalendar } from '@/features/task/components/TaskWeeklyCalendar';
import { TaskAiSuggestion, TaskAiReprioritize, TaskDetailsModal } from '@/features/task/components';
import RecurrenceModal from '@/features/task/components/RecurrenceModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FirestoreErrorHandler } from '@/components/ui/FirestoreErrorHandler';
import { useAuth } from '@/hooks/useAuth';
import { useTaskData } from '@/features/task/hooks/useTaskData';
import { Task } from '@/features/task/types';

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
    resync
  } = taskData;

  // Get search query from URL params
  const searchQuery = searchParams.get('search') || '';

  // Update URL when search changes
  const handleSearchChange = (query: string) => {
    if (query.trim()) {
      setSearchParams({ search: query });
    } else {
      setSearchParams({});
    }
  };

  // Filter tasks based on URL search parameter
  const filteredTasks = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    );
  }, [tasks, searchQuery]);

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
          let dueDate = undefined;
          
          if (taskData.dueDate) {
            const parsedDate = new Date(taskData.dueDate as string);
            if (!isNaN(parsedDate.getTime())) {
              dueDate = parsedDate;
            } else {
              invalidDatesCount++;
              console.warn(`Fecha inválida para tarea "${taskData.title}": ${taskData.dueDate}`);
            }
          }
          
          addTask({
            title: taskData.title,
            description: (taskData.description as string) || '',
            dueDate: dueDate,
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
      dueDate: task.dueDate?.toISOString() || null,
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

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
          {searchQuery && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              Buscando: "{searchQuery}"
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImportTasks}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportTasks}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAiSuggestion(true)}>
            <Brain className="w-4 h-4 mr-2" />
            IA
          </Button>
          <Button onClick={handleNewTask} className="bg-black text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Error Handler */}
      {error && (
        <div className="mb-4">
          <FirestoreErrorHandler 
            error={error} 
            onRetry={resync}
            showClearCache={true}
          />
        </div>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <TaskWeeklyCalendar
            tasks={filteredTasks}
            onDelete={deleteTask}
            onEdit={openEditModal}
            onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
            onMove={(id, dueDate) => editTask(id, { dueDate: dueDate || undefined })}
            onAssignTimeOfDay={(id, timeOfDay) => editTask(id, { timeOfDay })}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </CardContent>
      </Card>

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