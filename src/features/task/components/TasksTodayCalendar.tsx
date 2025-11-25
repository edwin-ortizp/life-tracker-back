import React, { useMemo, useEffect, useRef } from 'react';
import { isSameDay, format } from 'date-fns';
import { DndContext, DragEndEvent, DragMoveEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Task } from '../types';
import { TaskCalendarCompact } from './TaskCalendarCompact';
import { TaskItemCalendar } from './TaskItemCalendar';
import { cn } from '@/lib/utils';
import { pixelsToTime, snapToInterval, adjustEndDateToStartDate } from '@/utils/dates';

interface TasksTodayCalendarProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onQuickUpdate?: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
  onToggle?: (taskId: string, completed: boolean) => void;
}

// Generar franjas de 30 minutos desde 06:00 hasta 22:00
const generateTimeSlots = (): { hour: number; minute: number; label: string }[] => {
  const slots = [];
  for (let hour = 6; hour <= 22; hour++) {
    slots.push({ hour, minute: 0, label: `${hour.toString().padStart(2, '0')}:00` });
    if (hour < 22) {
      slots.push({ hour, minute: 30, label: `${hour.toString().padStart(2, '0')}:30` });
    }
  }
  return slots;
};

export const TasksTodayCalendar: React.FC<TasksTodayCalendarProps> = ({
  tasks,
  onDelete,
  onEdit,
  onQuickUpdate,
  onView,
  onMove,
  onToggle,
}) => {
  const today = new Date();
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const gridRef = useRef<HTMLDivElement>(null);

  // Configurar sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere mover 5px antes de iniciar drag (evita activación accidental)
      },
    })
  );

  // Auto-scroll a la hora actual al cargar (como Google Calendar)
  useEffect(() => {
    if (!gridRef.current) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Encontrar el slot más cercano
    const targetSlot = currentMinute < 30
      ? `${currentHour.toString().padStart(2, '0')}:00`
      : `${currentHour.toString().padStart(2, '0')}:30`;

    // Buscar el elemento con ese tiempo
    const targetElement = gridRef.current.querySelector(`[data-time="${targetSlot}"]`);

    if (targetElement) {
      // Scroll suave con offset para que no quede pegado al tope
      setTimeout(() => {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, []); // Solo ejecutar al montar

  // Separar tareas de hoy en: con hora y sin hora
  const { tasksWithTime, tasksWithoutTime } = useMemo(() => {
    const withTime: Task[] = [];
    const withoutTime: Task[] = [];

    tasks.forEach((task) => {
      if (!task.startDate) return;

      // Solo tareas de hoy
      if (!isSameDay(task.startDate, today)) return;

      const hour = task.startDate.getHours();
      const minute = task.startDate.getMinutes();

      // Si tiene hora específica (no es mediodía exacto que usamos por defecto)
      if (hour !== 12 || minute !== 0) {
        withTime.push(task);
      } else {
        // Verificar si endDate tiene hora diferente, entonces sí tiene tiempo
        if (task.endDate) {
          const endHour = task.endDate.getHours();
          const endMinute = task.endDate.getMinutes();
          if (endHour !== 12 || endMinute !== 0) {
            withTime.push(task);
          } else {
            withoutTime.push(task);
          }
        } else {
          withoutTime.push(task);
        }
      }
    });

    return { tasksWithTime: withTime, tasksWithoutTime: withoutTime };
  }, [tasks, today]);

  // Calcular posición top absoluta para una tarea (en píxeles desde las 6:00)
  const calculateTopPosition = (startDate: Date): number => {
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    // Minutos desde las 6:00
    const minutesFromStart = (startHour - 6) * 60 + startMinute;
    // Cada 30 minutos = 50px
    return (minutesFromStart / 30) * 50;
  };

  // Calcular altura de la tarea (en píxeles)
  const calculateHeight = (startDate: Date, endDate?: Date): number => {
    if (!endDate) {
      // Si no hay endDate, asumir 30 minutos (1 slot)
      return 50;
    }
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
    // Mínimo 50px (30 min), escalar según duración
    return Math.max(50, (durationMinutes / 30) * 50);
  };

  // Tipo para tarea con información de layout
  interface TaskWithLayout extends Task {
    top: number;
    height: number;
    columnIndex: number;
    totalColumns: number;
  }

  // Detectar tareas que se solapan y asignar columnas (algoritmo compacto)
  const tasksWithLayout = useMemo((): TaskWithLayout[] => {
    if (tasksWithTime.length === 0) return [];

    // Ordenar por hora de inicio, luego por duración (más largas primero)
    const sortedTasks = [...tasksWithTime].sort((a, b) => {
      const startDiff = a.startDate!.getTime() - b.startDate!.getTime();
      if (startDiff !== 0) return startDiff;

      // Si empiezan a la misma hora, poner las más largas primero
      const aDuration = a.endDate ? a.endDate.getTime() - a.startDate!.getTime() : 0;
      const bDuration = b.endDate ? b.endDate.getTime() - b.startDate!.getTime() : 0;
      return bDuration - aDuration;
    });

    // Calcular posiciones y alturas
    const tasksWithPositions = sortedTasks.map(task => ({
      ...task,
      top: calculateTopPosition(task.startDate!),
      height: calculateHeight(task.startDate!, task.endDate),
      columnIndex: 0,
      totalColumns: 1,
    }));

    // Algoritmo de empaquetamiento compacto estilo Google Calendar
    // Mantener un array de "columnas" donde cada columna guarda el bottom de la última tarea
    const columns: number[] = []; // columns[i] = bottom position de la última tarea en columna i

    for (const task of tasksWithPositions) {
      const taskTop = task.top;
      const taskBottom = task.top + task.height;

      // Buscar la primera columna donde quepa (de izquierda a derecha)
      let assignedColumn = -1;
      for (let col = 0; col < columns.length; col++) {
        if (columns[col] <= taskTop) {
          // Esta columna está libre (la última tarea terminó antes de que empiece esta)
          assignedColumn = col;
          break;
        }
      }

      if (assignedColumn === -1) {
        // No cabe en ninguna columna existente, crear nueva columna
        assignedColumn = columns.length;
        columns.push(0);
      }

      // Asignar tarea a esta columna
      task.columnIndex = assignedColumn;
      task.totalColumns = 1; // Se actualizará después
      columns[assignedColumn] = taskBottom; // Actualizar bottom de esta columna
    }

    // Segunda pasada: actualizar totalColumns para cada tarea
    // Agrupar tareas por clusters de solapamiento
    for (let i = 0; i < tasksWithPositions.length; i++) {
      const currentTask = tasksWithPositions[i];
      const currentBottom = currentTask.top + currentTask.height;

      // Encontrar el máximo número de columnas usado en este rango de tiempo
      let maxColumnsInRange = currentTask.columnIndex + 1;

      for (let j = 0; j < tasksWithPositions.length; j++) {
        if (i === j) continue;

        const otherTask = tasksWithPositions[j];
        const otherTop = otherTask.top;
        const otherBottom = otherTask.top + otherTask.height;

        // Si las tareas se solapan
        if (otherTop < currentBottom && otherBottom > currentTask.top) {
          maxColumnsInRange = Math.max(maxColumnsInRange, otherTask.columnIndex + 1);
        }
      }

      currentTask.totalColumns = maxColumnsInRange;
    }

    return tasksWithPositions;
  }, [tasksWithTime]);

  const totalTodayTasks = tasksWithTime.length + tasksWithoutTime.length;

  // Handlers para drag-and-drop
  const handleDragStart = () => {
    // Opcional: agregar lógica adicional al iniciar drag
  };

  const handleDragMove = (_event: DragMoveEvent) => {
    // Opcional: agregar preview visual durante el drag
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    if (!active.data.current?.task || !onMove) return;

    const task: Task = active.data.current.task;
    if (!task.startDate) return;

    // Calcular nueva posición basada en el delta Y
    const originalTop = calculateTopPosition(task.startDate);
    const newTop = Math.max(0, originalTop + delta.y);

    // Convertir pixels a tiempo
    const newStartDate = pixelsToTime(newTop, task.startDate);

    // Snap a intervalos de 15 minutos
    const snappedStartDate = snapToInterval(newStartDate, 15);

    // Validar que esté dentro del rango 6:00 - 22:00
    const newHour = snappedStartDate.getHours();
    if (newHour < 6 || newHour >= 22) {
      // Fuera de rango, no hacer nada
      return;
    }

    // Ajustar endDate preservando la duración
    const newEndDate = adjustEndDateToStartDate(task.startDate, task.endDate, snappedStartDate);

    // Validar que endDate también esté en rango
    if (newEndDate) {
      const endHour = newEndDate.getHours();
      if (endHour > 22) {
        // EndDate fuera de rango, no hacer nada
        return;
      }
    }

    // Actualizar la tarea
    onMove(task.id, snappedStartDate);
  };

  if (totalTodayTasks === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
    <div className="space-y-4">
      <div className="sticky top-0 bg-white py-2 z-10">
        <h3 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
          <span>📅</span>
          Hoy - {format(today, 'dd/MM/yyyy')} ({totalTodayTasks} tareas)
        </h3>
      </div>

      {/* Grid de franjas horarias */}
      {tasksWithTime.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b">
            <h4 className="text-xs font-semibold text-gray-700">Franjas Horarias (06:00 - 22:00)</h4>
          </div>
          <div
            ref={gridRef}
            className="max-h-[600px] overflow-y-auto relative"
            id="today-time-grid"
          >
            {/* CAPA 1: Grid de fondo con solo las líneas de tiempo */}
            <div className="divide-y">
              {timeSlots.map((slot) => {
                const isHourMark = slot.minute === 0;

                // Verificar si es la hora actual (para mostrar línea indicadora)
                const now = new Date();
                const isCurrentSlot =
                  now.getHours() === slot.hour &&
                  (now.getMinutes() < 30 ? slot.minute === 0 : slot.minute === 30);

                return (
                  <div
                    key={`${slot.hour}-${slot.minute}`}
                    className={cn(
                      'flex h-[50px] relative bg-gray-50/50',
                      isHourMark && 'border-t-2 border-gray-300'
                    )}
                    data-time={slot.label}
                  >
                    {/* Línea indicadora de hora actual */}
                    {isCurrentSlot && (
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500 z-30">
                        <div className="absolute left-0 top-0 w-2 h-2 bg-red-500 rounded-full -mt-[3px]" />
                      </div>
                    )}
                    {/* Hora */}
                    <div className={cn(
                      "w-16 flex-shrink-0 px-2 py-1 border-r bg-gray-50 flex items-center",
                      !isHourMark && "text-gray-400"
                    )}>
                      <span className={cn(
                        "text-[11px] font-medium",
                        isHourMark ? "text-gray-700" : "text-gray-400"
                      )}>
                        {slot.label}
                      </span>
                    </div>
                    {/* Área de tareas (vacía en capa de fondo) */}
                    <div className="flex-1" />
                  </div>
                );
              })}
            </div>

            {/* CAPA 2: Tareas con posicionamiento absoluto y columnas */}
            <div className="absolute top-0 left-16 right-0 pointer-events-none" style={{ height: `${timeSlots.length * 50}px` }}>
              {tasksWithLayout.map((task) => {
                // Calcular ancho y posición left según columnas
                const widthPercent = 100 / task.totalColumns;
                const leftPercent = (task.columnIndex / task.totalColumns) * 100;

                return (
                  <TaskCalendarCompact
                    key={task.id}
                    task={task}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onQuickUpdate={onQuickUpdate}
                    onToggle={onToggle}
                    className="pointer-events-auto"
                    style={{
                      position: 'absolute',
                      top: `${task.top}px`,
                      height: `${task.height - 2}px`, // -2px para pequeño gap visual
                      left: `${leftPercent}%`,
                      width: `calc(${widthPercent}% - 4px)`, // -4px para margen entre columnas
                      marginLeft: '2px',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tareas sin hora asignada */}
      {tasksWithoutTime.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-amber-50 px-3 py-2 border-b border-amber-200">
            <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1">
              <span>⏰</span>
              Sin Hora Asignada ({tasksWithoutTime.length})
            </h4>
          </div>
          <div className="p-2 space-y-2 bg-white">
            {tasksWithoutTime.map((task) => (
              <TaskItemCalendar
                key={task.id}
                task={task}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
                onMove={onMove}
                showCategoryLabel={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </DndContext>
  );
};
