import { useState } from 'react';
import { CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react'; // ChevronDown removed
import type { PomodoroSession } from '../models';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { Button } from '@/shared/components/ui/button';

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
  onEditSession?: (session: PomodoroSession) => void;
}

export const PomodoroHistory = ({ 
  sessions,
  onDeleteSession,
  onEditSession 
}: PomodoroHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortedSessions = [...sessions].sort((a, b) => 
    b.startTime.timestamp - a.startTime.timestamp
  );

  return (
    <Accordion
      type="single"
      collapsible
      onValueChange={(value) => setIsOpen(!!value)}
      value={isOpen ? "history" : ""}
    >
      <AccordionItem value="history" className="border-none">
        <AccordionTrigger className="w-full h-11 flex items-center justify-center gap-2 border rounded-lg bg-background hover:bg-accent data-[state=open]:rounded-b-none">
          {/* ChevronDown is automatically handled by AccordionTrigger */}
          <span className="text-sm font-semibold">Historial de hoy</span>
        </AccordionTrigger>
        <AccordionContent className="mt-2 space-y-2">
          {sortedSessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-2">
              No hay sesiones registradas hoy
            </div>
          ) : (
            sortedSessions.map((session, index) => (
              <div 
                key={session.startTime.timestamp}
                className="flex flex-col p-2.5 bg-muted rounded-lg text-sm" // Changed bg-gray-50 to bg-muted
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-auto w-auto p-1"
                        onClick={() => onEditSession(session)}
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    )}
                    {onDeleteSession && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-auto w-auto p-1"
                        onClick={() => onDeleteSession(session)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};