import { useState, Fragment, useEffect } from 'react';
import type { PomodoroSession } from '../types';

interface PomodoroEditModalProps {
  session: PomodoroSession | null;
  onClose: () => void;
  onSave: (oldSession: PomodoroSession, updatedSession: Partial<PomodoroSession>) => void;
}

export const PomodoroEditModal = ({
  session,
  onClose,
  onSave
}: PomodoroEditModalProps) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [completed, setCompleted] = useState(false);

  // Actualizar el estado cuando cambia la sesión seleccionada
  useEffect(() => {
    if (session) {
      // Extraer solo la hora y minutos de las fechas ISO
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
      setCompleted(session.completed);
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    const baseDate = new Date(session.startTime);
    
    // Crear nuevas fechas manteniendo el día pero actualizando las horas
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const newStartTime = new Date(baseDate);
    newStartTime.setHours(startHours, startMinutes, 0);
    
    const newEndTime = new Date(baseDate);
    newEndTime.setHours(endHours, endMinutes, 0);
    
    // Si la hora de fin es menor que la de inicio, asumimos que es del día siguiente
    if (newEndTime < newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }
    
    const duration = (newEndTime.getTime() - newStartTime.getTime()) / 1000;

    onSave(session, {
      startTime: newStartTime.toISOString(),
      endTime: newEndTime.toISOString(),
      duration,
      completed
    });
    onClose();
  };

  return (
    <Fragment>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">Editar Sesión Pomodoro</h3>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Hora inicio
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  Hora fin
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="completed"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="completed" className="text-sm text-gray-700">
                Sesión completada
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};