// src/features/task/components/index.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TaskList } from './TaskList';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { TaskAiMenu } from './TaskAiMenu';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Exports
export * from './TaskKanban';
export * from './TaskList';
export * from './TaskDetailsModal';
export * from './PriorityLegend';
export * from './PrivateTaskSection';
export * from './TaskAiSuggestion';
export * from './TaskAiMenu';
export * from './TaskAiBreakdown';
export * from './TaskAiImproveDescription';
export * from './TaskAiIdeas';
export * from './TaskAiReprioritize';
export * from './AiLoadingBar';
export * from './TaskEstimatedTimeInput';
export * from "./TaskTimeOfDaySelect";
export * from "./TaskWeeklyCalendar";
export * from "./TaskWeekView";
export * from "./TaskKanbanView";
export * from "./UnassignedTaskItem";
import { RecurrenceModal } from './RecurrenceModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useTaskData } from '../hooks/useTaskData';
import type { TaskProps, Task as TaskType } from '../types';

export const Task: React.FC<TaskProps> = ({ showFloatingButton = false }) => {
  const { user } = useAuth();
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
    toggleTask,
    deleteTask,
    completeRecurrentTask,
    setShowRecurrenceModal,
    openEditModal,
    openCreateModal,
    resync
  } = taskData;
  const { isOnline } = useNetworkStatus();

  const [detailTask, setDetailTask] = useState<TaskType | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Filtrar solo tareas públicas (no privadas)
  const publicTasks = tasks.filter(task => !task.isPrivate);

  const handleImportTasks = () => {
    try {
      const tasksToImport = JSON.parse(importJson);
      
      if (!Array.isArray(tasksToImport)) {
        toast.error('El JSON debe contener un array de tareas');
        return;
      }

      let importedCount = 0;
      let invalidDatesCount = 0;
      
      tasksToImport.forEach((taskData: any) => {
        if (taskData.title) {
          let dueDate = undefined;
          
          // Manejo mejorado de fechas
          if (taskData.dueDate) {
            const parsedDate = new Date(taskData.dueDate);
            if (!isNaN(parsedDate.getTime())) {
              dueDate = parsedDate;
            } else {
              invalidDatesCount++;
              console.warn(`Fecha inválida para tarea "${taskData.title}": ${taskData.dueDate}`);
            }
          }
          
          addTask({
            title: taskData.title,
            description: taskData.description || '',
            dueDate: dueDate,
            category: taskData.category || 'personal',
            priority: taskData.priority || undefined,
            isPrivate: false, // Las tareas generales no son privadas
            isRecurrent: taskData.isRecurrent || false,
            size: taskData.size || undefined
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
    const exportData = publicTasks.map(task => ({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate?.toISOString(),
      category: task.category,
      priority: task.priority,
      size: task.size,
      completed: task.completed,
      isRecurrent: task.isRecurrent || false,
      ...(task.recurrence && {
        recurrence: {
          frequency: task.recurrence.frequency,
          pattern: task.recurrence.pattern,
          customDays: task.recurrence.customDays,
          nextDate: task.recurrence.nextDate?.toISOString()
        }
      })
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('Tareas copiadas al portapapeles con fechas incluidas');
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Inicia sesión para gestionar tus tareas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 relative">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tareas Pendientes</CardTitle>
            <div className="hidden md:flex items-center gap-4 text-xs">
              {status === 'saving' && (
                <span className="text-blue-500">Guardando...</span>
              )}
              {status === 'pending' && (
                <span className="text-yellow-600">Pendiente de sincronizar</span>
              )}
              {status === 'saved' && (
                <span className="text-green-600">Sincronizado</span>
              )}
              {status === 'error' && (
                <span className="text-red-600">Error de sincronización</span>
              )}
              {!isOnline && <span className="text-orange-600">Offline</span>}
              <Button onClick={resync} variant="link" className="p-0 h-auto">Reintentar</Button>
              
              {/* Botones de importar/exportar */}
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
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
    "description": "Terminar la implementación",
    "dueDate": "2024-12-31",
    "category": "work",
    "priority": "do",
    "size": "grande"
  },
  {
    "title": "Revisión médica anual", 
    "description": "Chequeo general de salud",
    "dueDate": "2024-07-15T09:00:00Z",
    "category": "health",
    "priority": "decide"
  },
  {
    "title": "Tarea flexible",
    "description": "Esta tarea no tiene fecha límite específica",
    "category": "personal",
    "isRecurrent": true
  }
]

Formatos de fecha soportados:
- "2024-12-31" (solo fecha)
- "2024-06-15T14:30:00Z" (fecha y hora ISO)
- "2024-06-15T14:30:00" (fecha y hora local)
- Sin campo "dueDate" = sin fecha asignada

Campos opcionales:
- description, dueDate, priority, size, isRecurrent`}
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleImportTasks} disabled={!importJson.trim()}>
                        Importar Tareas
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button size="sm" variant="outline" onClick={handleExportTasks}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>

              <TaskAiMenu tasks={tasks} onUpdate={(id, u) => editTask(id, u)} />

              <Button onClick={() => openCreateModal()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
            {/* Solo mostrar estado en móvil */}
            <div className="md:hidden text-xs">
              {status === 'saving' && (
                <span className="text-blue-500">Guardando...</span>
              )}
              {status === 'pending' && (
                <span className="text-yellow-600">Pendiente de sincronizar</span>
              )}
              {status === 'saved' && (
                <span className="text-green-600">Sincronizado</span>
              )}
              {status === 'error' && (
                <span className="text-red-600">Error de sincronización</span>
              )}
              {!isOnline && <span className="text-orange-600">Offline</span>}
              <Button onClick={resync} variant="link" className="p-0 h-auto">Reintentar</Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <TaskList
              tasks={tasks}
              onDelete={deleteTask}
              onEdit={openEditModal}
              onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
            />

            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botón flotante para móviles (estilo Material Design) - Solo en páginas dedicadas */}
      {showFloatingButton && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => openCreateModal()}
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 active:scale-95 border-0 flex items-center justify-center text-white"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </div>
      )}

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
        onEdit={(t) => { setShowDetailModal(false); openEditModal(t); }}
        onToggle={toggleTask}
      />
    </div>
  );
};

export default Task;
