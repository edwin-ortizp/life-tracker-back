import React, { useState } from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TaskItem } from './TaskItem';
import { TaskDetailsModal } from './TaskDetailsModal';
import { RecurrenceModal } from './RecurrenceModal';
import { useTaskData } from '../hooks/useTaskData';
import type { Task } from '../types';
import { isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PrivateTaskSectionProps {
  selectedDate: Date;
}

export const PrivateTaskSection: React.FC<PrivateTaskSectionProps> = ({ selectedDate }) => {
  const {
    allTasks: tasks,
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
    openCreateModal
  } = useTaskData();
  const navigate = useNavigate();

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Filtrar tareas privadas
  const privateTasks = tasks.filter(task => task.isPrivate);
  
  // Tareas privadas del día seleccionado
  const todaysPrivateTasks = privateTasks.filter(task => 
    task.dueDate && isSameDay(task.dueDate, selectedDate)
  );
  
  // Tareas privadas pendientes (sin fecha o de otros días no completadas)
  const pendingPrivateTasks = privateTasks.filter(task => 
    !task.completed && (!task.dueDate || !isSameDay(task.dueDate, selectedDate))
  );

  const handleCreatePrivateTask = () => {
    openCreateModal(selectedDate, true); // true indica que es privada
  };
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
            dueDate: dueDate, // Usar la fecha parseada o undefined si no hay fecha válida
            category: taskData.category || 'personal',
            priority: taskData.priority || undefined,
            isPrivate: true, // Siempre privada
            isRecurrent: taskData.isRecurrent || false,
            // Soporte para campos adicionales
            size: taskData.size || undefined
          });
          importedCount++;
        }
      });

      if (invalidDatesCount > 0) {
        toast.warning(`${importedCount} tareas importadas. ${invalidDatesCount} fechas inválidas fueron omitidas.`);
      } else {
        toast.success(`${importedCount} tareas privadas importadas correctamente`);
      }
      
      setImportJson('');
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Error al importar las tareas. Verifica el formato JSON.');
      console.error('Error de importación:', error);
    }
  };
  const handleExportTasks = () => {
    const exportData = privateTasks.map(task => ({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate?.toISOString(),
      category: task.category,
      priority: task.priority,
      size: task.size,
      completed: task.completed,
      isRecurrent: task.isRecurrent || false,
      // Incluir información de recurrencia si existe
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
      toast.success('Tareas privadas copiadas al portapapeles con fechas incluidas');
    });
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">🔒 Tareas Privadas</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {privateTasks.length} total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tareas del día */}
        {todaysPrivateTasks.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-2">
              Para hoy ({todaysPrivateTasks.length})
            </h4>
            <div className="space-y-2">
              {todaysPrivateTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onDelete={deleteTask}
                  onEdit={openEditModal}
                  onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
                  onRun={(task) => {
                    setShowDetailModal(false);
                    navigate(`/task/run/${task.id}`);
                  }}
                  variant="list"
                />
              ))}
            </div>
          </div>
        )}

        {/* Tareas pendientes */}
        {pendingPrivateTasks.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-2">
              Pendientes ({pendingPrivateTasks.length})
            </h4>
            <div className="space-y-2">
              {pendingPrivateTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onDelete={deleteTask}
                  onEdit={openEditModal}
                  onView={(task) => { setDetailTask(task); setShowDetailModal(true); }}
                  onRun={(task) => {
                    setShowDetailModal(false);
                    navigate(`/task/run/${task.id}`);
                  }}
                  variant="list"
                />
              ))}
            </div>
          </div>
        )}

        {privateTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No tienes tareas privadas</p>
            <p className="text-sm">Crea una nueva o importa desde JSON</p>
          </div>
        )}

        {status === 'saving' && (
          <Badge variant="secondary" className="text-xs">
            Guardando...
          </Badge>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </CardContent>

      <CardFooter className="justify-end flex-wrap gap-2">
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Tareas Privadas</DialogTitle>
              <DialogDescription>
                Pega el JSON con las tareas a importar. Todas se marcar\u00e1n como privadas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder={`Ejemplo - Puedes incluir fechas en formato ISO (YYYY-MM-DD) o dejarlas sin fecha:
[
  {
    "title": "Reflexi\u00f3n personal importante",
    "description": "Pensar sobre mis metas de vida",
    "dueDate": "2024-12-31",
    "category": "personal",
    "priority": "do",
    "size": "mediana"
  },
  {
    "title": "Tarea sensible del trabajo",
    "description": "Revisar tema confidencial",
    "dueDate": "2024-06-15T14:30:00Z",
    "category": "work",
    "priority": "decide"
  },
  {
    "title": "Tarea sin fecha espec\u00edfica",
    "description": "Esta tarea no tiene fecha l\u00edmite",
    "category": "personal"
  }
]

Formatos de fecha soportados:
- "2024-12-31" (solo fecha)
- "2024-06-15T14:30:00Z" (fecha y hora ISO)
- "2024-06-15T14:30:00" (fecha y hora local)
- Sin campo "dueDate" = sin fecha asignada`}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={15}
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

        <Button size="sm" onClick={handleCreatePrivateTask}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Privada
        </Button>
      </CardFooter>

      {/* Modales */}
      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal()}
        onConfirm={(data) => {
          const taskData = { ...data, isPrivate: true };
          if (modalMode === 'complete') {
            completeRecurrentTask(taskData);
          } else if (modalMode === 'edit') {
            editTask(currentTask!.id, taskData);
          } else {
            addTask(taskData);
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
    </Card>
  );
};
