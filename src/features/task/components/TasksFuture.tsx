import React, { useMemo } from 'react';
import { isAfter, startOfDay, format, isSameDay } from 'date-fns';
import { Task } from '../types';
import { TaskItemCalendar } from './TaskItemCalendar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { es } from 'date-fns/locale';

interface TasksFutureProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
}

export const TasksFuture: React.FC<TasksFutureProps> = ({
  tasks,
  onDelete,
  onEdit,
  onView,
  onMove,
}) => {
  const today = new Date();
  const todayStart = startOfDay(today);

  // Agrupar tareas futuras por fecha
  const futureTasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    tasks.forEach((task) => {
      if (!task.startDate) return;

      // Solo tareas futuras (después de hoy)
      if (!isAfter(startOfDay(task.startDate), todayStart)) return;
      if (isSameDay(task.startDate, today)) return; // Excluir hoy

      const dateKey = format(task.startDate, 'yyyy-MM-dd');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(task);
    });

    // Ordenar tareas dentro de cada fecha
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        // Si ambas tienen hora, ordenar por hora
        if (a.startDate && b.startDate) {
          const aHasTime = a.startDate.getHours() !== 12 || a.startDate.getMinutes() !== 0;
          const bHasTime = b.startDate.getHours() !== 12 || b.startDate.getMinutes() !== 0;

          if (aHasTime && bHasTime) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          if (aHasTime) return -1;
          if (bHasTime) return 1;
        }
        return 0;
      });
    });

    return grouped;
  }, [tasks, today, todayStart]);

  // Ordenar fechas
  const sortedDates = useMemo(() => {
    return Object.keys(futureTasksByDate).sort((a, b) => a.localeCompare(b));
  }, [futureTasksByDate]);

  const totalFutureTasks = sortedDates.reduce(
    (sum, date) => sum + futureTasksByDate[date].length,
    0
  );

  if (totalFutureTasks === 0) {
    return null;
  }

  // Función para determinar si una tarea tiene hora específica
  const hasSpecificTime = (task: Task): boolean => {
    if (!task.startDate) return false;
    const hour = task.startDate.getHours();
    const minute = task.startDate.getMinutes();
    return hour !== 12 || minute !== 0;
  };

  // Formatear rango de hora
  const formatTimeRange = (task: Task): string => {
    if (!task.startDate || !hasSpecificTime(task)) return '';

    const start = format(task.startDate, 'HH:mm');

    if (task.endDate) {
      const end = format(task.endDate, 'HH:mm');
      return `${start} - ${end}`;
    }

    return start;
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white py-2 z-10">
        <h3 className="text-sm font-semibold text-green-600 flex items-center gap-2">
          <span>📆</span>
          Tareas Futuras ({totalFutureTasks})
        </h3>
      </div>

      <div className="space-y-6">
        {sortedDates.map((dateKey) => {
          const dateTasks = futureTasksByDate[dateKey];
          const dateObj = new Date(dateKey + 'T12:00:00'); // Añadir hora para evitar problemas de zona horaria

          return (
            <div key={dateKey} className="space-y-2">
              {/* Encabezado de fecha */}
              <div className="flex items-center gap-2 pb-1 border-b">
                <Calendar className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-semibold text-gray-700">
                  {format(dateObj, "EEEE, d 'de' MMMM", { locale: es })}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {dateTasks.length} {dateTasks.length === 1 ? 'tarea' : 'tareas'}
                </Badge>
              </div>

              {/* Lista de tareas */}
              <div className="space-y-2 pl-2">
                {dateTasks.map((task) => {
                  const timeRange = formatTimeRange(task);

                  return (
                    <div key={task.id} className="space-y-1">
                      {/* Chip de hora si existe */}
                      {timeRange && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {timeRange}
                        </Badge>
                      )}

                      <TaskItemCalendar
                        task={task}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onView={onView}
                        onMove={onMove}
                        showCategoryLabel={true}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
