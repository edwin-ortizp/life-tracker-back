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
  const [description, setDescription] = useState("");

  // Actualizar el estado cuando cambia la sesión seleccionada
  useEffect(() => {
    if (session) {
      const start = new Date(session.startTime.timestamp);
      const end = new Date(session.endTime.timestamp);
      
      setStartTime(
        `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
      );
      setEndTime(
        `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
      );
      setCompleted(session.completed);
      setDescription(session.description || "");
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    const baseDate = new Date(session.startTime.timestamp);
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const newStartTime = new Date(baseDate);
    newStartTime.setHours(startHours, startMinutes, 0, 0);
    
    const newEndTime = new Date(baseDate);
    newEndTime.setHours(endHours, endMinutes, 0, 0);
    
    if (newEndTime < newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }

    const updatedSession: Partial<PomodoroSession> = {
      startTime: {
        timestamp: newStartTime.getTime(),
        utcOffset: -newStartTime.getTimezoneOffset(),
        formatted: new Date(newStartTime).toLocaleString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
        }) + ` UTC${-newStartTime.getTimezoneOffset() >= 0 ? '+' : '-'}${Math.abs(Math.floor(-newStartTime.getTimezoneOffset() / 60))}`
      },
      endTime: {
        timestamp: newEndTime.getTime(),
        utcOffset: -newEndTime.getTimezoneOffset(),
        formatted: new Date(newEndTime).toLocaleString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true
        }) + ` UTC${-newEndTime.getTimezoneOffset() >= 0 ? '+' : '-'}${Math.abs(Math.floor(-newEndTime.getTimezoneOffset() / 60))}`
      },
      duration: (newEndTime.getTime() - newStartTime.getTime()) / 1000,
      completed,
      description: description.trim() || undefined // Solo guardamos si hay descripción
    };

    onSave(session, updatedSession);
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

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción (opcional)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué hiciste en esta sesión?"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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