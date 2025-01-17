import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, ChevronDown, Edit, Trash2 } from 'lucide-react';
import type { PomodoroSession } from '../types';

interface PomodoroHistoryProps {
  sessions: PomodoroSession[];
  onDeleteSession?: (session: PomodoroSession) => void;
  onEditSession?: (session: PomodoroSession) => void;
}

interface TimestampWithOffset {
  timestamp: number;
  utcOffset: number;
}

const formatTimestampWithOffset = (timestampWithOffset: TimestampWithOffset) => {
  const date = new Date(timestampWithOffset.timestamp);
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const PomodoroHistory = ({ sessions, onDeleteSession, onEditSession }: PomodoroHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (sessions.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-2">
        No hay sesiones registradas hoy
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <span>Historial del día ({sessions.length} sesiones)</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
          {sessions.map((session) => (
            <div 
              key={session.startTime.timestamp}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
            >
              {session.completed ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className="flex-1">
                {formatTimestampWithOffset(session.startTime)} -{' '}
                {formatTimestampWithOffset(session.endTime)}
                <span className="text-xs text-gray-500 ml-2">
                  UTC{session.startTime.utcOffset >= 0 ? '+' : '-'}
                  {Math.abs(Math.floor(session.startTime.utcOffset / 60))}
                </span>
              </span>
              <span className="text-gray-500">
                {Math.floor(session.duration / 60)}min
              </span>
              
              <div className="flex gap-2 ml-2">
                {onEditSession && (
                  <button
                    className="p-1 hover:bg-gray-200 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSession(session);
                    }}
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                )}
                {onDeleteSession && (
                  <button
                    className="p-1 hover:bg-gray-200 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};