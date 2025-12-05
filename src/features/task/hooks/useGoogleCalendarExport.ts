import { useCallback } from 'react';
import { Task, CATEGORY_LABELS } from '../types';
import { openGoogleCalendar } from '@/utils/googleCalendarExport';

export function useGoogleCalendarExport() {
  const exportTaskToGoogleCalendar = useCallback((task: Task) => {
    // No exportar tareas privadas
    if (task.isPrivate) {
      console.warn('Private tasks cannot be exported to Google Calendar');
      return;
    }

    // Validar que tenga fecha de inicio
    if (!task.startDate) {
      console.warn('Task must have a start date to export');
      return;
    }

    // Construir descripción enriquecida
    let description = '';

    // Agregar categoría
    const categoryLabel = CATEGORY_LABELS[task.category];
    description += `📁 Categoría: ${categoryLabel}\n\n`;

    // Agregar prioridad si existe
    if (task.priority) {
      const priorityLabels = {
        do: '🔴 HACER (Urgente e Importante)',
        decide: '🟡 DECIDIR (Importante)',
        delegate: '🔵 DELEGAR (Urgente)',
        delete: '⚪ ELIMINAR'
      };
      description += `⚡ Prioridad: ${priorityLabels[task.priority]}\n\n`;
    }

    // Agregar tiempo estimado
    if (task.estimatedTime) {
      const hours = Math.floor(task.estimatedTime / 60);
      const mins = task.estimatedTime % 60;
      const timeStr = hours > 0
        ? `${hours}h ${mins}min`
        : `${mins}min`;
      description += `⏱️ Tiempo estimado: ${timeStr}\n\n`;
    }

    // Agregar descripción de la tarea
    if (task.description) {
      description += `📝 Descripción:\n${task.description}\n\n`;
    }

    // Agregar recurrencia si aplica
    if (task.isRecurrent && task.recurrence) {
      description += `🔁 Tarea recurrente (${task.recurrence.pattern})\n`;
    }

    // Footer con código de tarea
    description += `\n---\nTarea #${task.taskCode} - Life Tracker`;

    // Determinar fecha de fin
    let endDate = task.endDate;
    if (!endDate && task.estimatedTime) {
      // Si no hay endDate pero hay estimatedTime, calcularlo
      endDate = new Date(task.startDate.getTime() + task.estimatedTime * 60 * 1000);
    }

    openGoogleCalendar({
      title: task.title,
      description,
      startDate: task.startDate,
      endDate,
      location: undefined
    });
  }, []);

  return { exportTaskToGoogleCalendar };
}
