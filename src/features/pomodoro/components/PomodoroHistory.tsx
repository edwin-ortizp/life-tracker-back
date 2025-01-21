import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { PomodoroEditModal } from './PomodoroEditModal';
import type { PomodoroSession } from '../types';

const formatTimeOnly = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

interface PomodoroHistoryProps {
  sessions: PomodoroSession[];
  onDeleteSession?: (session: PomodoroSession) => void;
  onEditSession?: (oldSession: PomodoroSession, updatedSession: Partial<PomodoroSession>) => void;
}

export const PomodoroHistory = ({ 
  sessions,
  onDeleteSession,
  onEditSession 
}: PomodoroHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PomodoroSession | null>(null);

  const sortedSessions = [...sessions].sort((a, b) => 
    b.startTime.timestamp - a.startTime.timestamp
  );

  const handleEditSave = (oldSession: PomodoroSession, updatedSession: Partial<PomodoroSession>) => {
    if (onEditSession) {
      onEditSession(oldSession, updatedSession);
    }
    setSelectedSession(null);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 flex items-center justify-center gap-2 border rounded-lg bg-white"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 transition-transform transform rotate-180" />
        ) : (
          <ChevronDown className="w-4 h-4 transition-transform" />
        )}
        <span className="text-sm font-semibold">Historial de hoy</span>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {sortedSessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-2">
              No hay sesiones registradas hoy
            </div>
          ) : (
            sortedSessions.map((session, index) => (
              <div 
                key={session.startTime.timestamp}
                className="flex flex-col p-2.5 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  {session.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                      <span>{formatTimeOnly(session.startTime.timestamp)}</span>
                      <span className="text-gray-400">→</span>
                      <span>{formatTimeOnly(session.endTime.timestamp)}</span>
                    </div>
                  </div>
                  
                  <span className="text-gray-500 whitespace-nowrap">
                    {Math.floor(session.duration / 60)}min
                  </span>
                  
                  <div className="flex gap-1 ml-2">
                    {onEditSession && (
                      <button
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                        }}
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {onDeleteSession && (
                      <button
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
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
                
                {session.description && (
                  <div className="ml-6 mt-1 text-xs text-gray-500">
                    {session.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <PomodoroEditModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onSave={handleEditSave}
      />
    </div>
  );
};