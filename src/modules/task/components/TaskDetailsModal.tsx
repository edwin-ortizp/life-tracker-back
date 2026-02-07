import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
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
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar } from 'lucide-react';
import { useGoogleCalendarExport } from '../controllers/useGoogleCalendarExport';
import { Progress } from '@/shared/components/ui/progress';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../models';
import { isBefore, startOfDay } from 'date-fns';
import { formatDateToSpanish, getRecurrenceText } from '@/shared/utils/dates';
import { renderMarkdown, getCheckboxStats } from '@/shared/utils/markdown';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggle?: (taskId: string, completed: boolean) => void;
  onDelete?: (taskId: string) => void;
}

// Función para obtener información de prioridad
const getPriorityInfo = (priority?: string) => {
  const priorityMap = {
    do: { label: 'HACER', color: 'bg-red-500', text: 'Urgente e importante', urgent: true, important: true },
    decide: { label: 'DECIDIR', color: 'bg-yellow-500', text: 'Importante pero no urgente', urgent: false, important: true },
    delegate: { label: 'DELEGAR', color: 'bg-blue-500', text: 'Urgente pero no importante', urgent: true, important: false },
    delete: { label: 'ELIMINAR', color: 'bg-gray-500', text: 'Ni urgente ni importante', urgent: false, important: false },
    none: { label: '', color: '', text: '', urgent: false, important: false }
  };
  
  return priorityMap[priority as keyof typeof priorityMap] || priorityMap.none;
};

// Función para formatear tiempo estimado
const formatEstimatedTime = (minutes?: number) => {
  if (!minutes) return '';
  
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}min`;
    }
  }
};

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onToggle,
  onDelete
}) => {
  if (!task) return null;

  const navigate = useNavigate();
  const { exportTaskToGoogleCalendar } = useGoogleCalendarExport();

  const categoryStyle = CATEGORY_COLORS[task.category];
  const priorityInfo = getPriorityInfo(task.priority);
  const recurrenceDescription =
    task.isRecurrent && task.recurrence
      ? getRecurrenceText(
          task.startDate || new Date(),
          task.recurrence.pattern,
          task.recurrence.customDays
        )
      : '';
  const overdue =
    task.startDate &&
    isBefore(startOfDay(task.startDate), startOfDay(new Date()));
  const { total, checked } = getCheckboxStats(task.description || '');
  const hasCheckboxes = total > 0;
  const progress = hasCheckboxes ? task.progress ?? (checked / total) * 100 : 0;
  const descriptionHtml = renderMarkdown(task.description || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Columna Principal (8/12) */}
          <div className="col-span-12 md:col-span-8 space-y-6">
            {/* Header Section */}
            <DialogHeader className="space-y-4">
              <div className="flex items-start gap-3">
                {task.isPrivate && (
                  <span className="text-lg mt-1">🔒</span>
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-semibold leading-tight break-words text-gray-900">
                    {task.title}
                  </DialogTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500">
                      en lista <span className="font-medium">{CATEGORY_LABELS[task.category]}</span>
                    </p>
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                      <span className="text-xs font-mono">#{task.taskCode}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Información básica en línea */}
            <div className="flex flex-wrap gap-3">

              {/* Fecha límite */}
              {task.startDate && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  overdue 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  <span>📅</span>
                  {formatDateToSpanish(task.startDate)}
                  {overdue && ' (Vencida)'}
                </div>
              )}

              {/* Momento del día */}
              {task.timeOfDay && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  <span>🕐</span>
                  {task.timeOfDay === 'morning' && 'Mañana'}
                  {task.timeOfDay === 'afternoon' && 'Tarde'}
                  {task.timeOfDay === 'evening' && 'Noche'}
                </div>
              )}
            </div>

            {/* Descripción */}
            {task.description && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>📝</span>
                  Descripción
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-gray-700" 
                       dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                  {hasCheckboxes && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">Progreso de elementos</span>
                        <span className="text-gray-600">{checked} de {total} completados</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detalles adicionales */}
            {(task.priority && priorityInfo.text) || (task.isRecurrent && recurrenceDescription) ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>�</span>
                  Detalles adicionales
                </h3>
                
                {/* Matriz de Eisenhower */}
                {task.priority && priorityInfo.text && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Matriz de Eisenhower</h4>
                    <p className="text-sm text-gray-600 mb-3">{priorityInfo.text}</p>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Urgente:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${priorityInfo.urgent ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                          {priorityInfo.urgent ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Importante:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${priorityInfo.important ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                          {priorityInfo.important ? 'Sí' : 'No'}
                        </span>
                      </div>
                      {/* Prioridad */}
                    {priorityInfo.label && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white ${priorityInfo.color}`}>
                        <span>⚡</span>
                        {priorityInfo.label}
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Información de creación */}
            {/* Movida a la columna lateral */}
          </div>

          {/* Columna Lateral (4/12) */}
          <div className="col-span-12 md:col-span-4 space-y-6">
            {/* Acciones */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Acciones</h3>
              <div className="space-y-2">
                {onToggle && (
                  <Button
                    onClick={() => onToggle(task.id, !task.completed)}
                    variant={task.completed ? "outline" : "default"}
                    className="w-full justify-start gap-2"
                  >
                    {task.completed ? (
                      <>
                        <span>↩️</span>
                        Marcar pendiente
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        Marcar completada
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => navigate(`/task/${task.id}/run`)}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Play className="w-4 h-4" />
                  Ejecutar
                </Button>
                {/* Exportar a Google Calendar */}
                {task.startDate && !task.isPrivate && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => exportTaskToGoogleCalendar(task)}
                  >
                    <Calendar className="w-4 h-4" />
                    Exportar a Google Calendar
                  </Button>
                )}
                <Button
                  onClick={() => onEdit(task)}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <span>✏️</span>
                  Editar
                </Button>
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <span>🗑️</span>
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La tarea "{task.title}" será eliminada permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onDelete(task.id);
                            onClose();
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Organización */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Organización</h3>
              
              {/* Lista/Categoría */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Lista</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
                  <span>📋</span>
                  {CATEGORY_LABELS[task.category]}
                </div>
              </div>

              {/* Tamaño */}
              {task.size && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Tamaño</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <span>📏</span>
                    {task.size}
                  </div>
                </div>
              )}

              {/* Tiempo estimado */}
              {task.estimatedTime && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Tiempo estimado</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                    <span>⏱️</span>
                    {formatEstimatedTime(task.estimatedTime)}
                  </div>
                </div>
              )}

              {/* Recurrencia */}
              {task.isRecurrent && recurrenceDescription && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Recurrencia</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <span>🔄</span>
                    {recurrenceDescription}
                  </div>
                </div>
              )}
            </div>

            {/* Estado y Metadatos */}
            <div className="space-y-4">
              

              {/* Fecha de creación */}
              <div className="text-sm text-gray-500 pt-2 border-t">
                <p className="font-medium text-gray-600 mb-1">Creada</p>
                {task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Recientemente'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
