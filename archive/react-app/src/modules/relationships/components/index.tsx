import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bell, Calendar, CheckCircle2, Clock3, MessageCircle, Plus, Search, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import {
  RELATIONSHIP_CATEGORY_LABELS,
  RELATIONSHIP_EVENT_TYPES,
  RELATIONSHIP_EVENT_TYPE_LABELS,
  type Circle,
  type RelationshipsFilterKey,
  type RelationshipEvent,
  type RelationshipEventType,
  type RelationshipPerson,
  type RelationshipUrgency,
  type RelatedTask
} from '@/modules/relationships/models';
import { getDaysFromToday, getRelationshipUrgency, parseIsoLikeDate, startOfLocalDay } from '@/modules/relationships/utils/urgency';

const toIsoFromInput = (value: string) => (value ? new Date(value).toISOString() : undefined);

const formatDate = (isoLike?: string) => {
  if (!isoLike) return 'Sin fecha';
  const date = parseIsoLikeDate(isoLike);
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getLastContactLabel = (isoLike?: string) => {
  if (!isoLike) return 'Sin registro';
  const days = getDaysFromToday(isoLike);
  if (days === null) return formatDate(isoLike);
  const abs = Math.abs(days);
  if (abs === 0) return `${formatDate(isoLike)} (hoy)`;
  if (days < 0) return `${formatDate(isoLike)} (hace ${abs} día${abs === 1 ? '' : 's'})`;
  return `${formatDate(isoLike)} (en ${days} día${days === 1 ? '' : 's'})`;
};

const getNextContactStatus = (isoLike?: string) => {
  const days = getDaysFromToday(isoLike);
  const urgency = getRelationshipUrgency(isoLike);

  if (days === null) {
    return { urgency, label: 'Sin definir', className: 'text-gray-600', dot: 'bg-gray-400' };
  }
  if (days < 0) {
    return { urgency, label: `${formatDate(isoLike)} (vencido ${Math.abs(days)}d)`, className: 'text-red-700', dot: 'bg-red-500' };
  }
  if (days <= 2) {
    return {
      urgency,
      label: days === 0 ? `${formatDate(isoLike)} (hoy)` : `${formatDate(isoLike)} (en ${days}d)`,
      className: 'text-amber-700',
      dot: 'bg-amber-500'
    };
  }
  return { urgency, label: `${formatDate(isoLike)} (en ${days}d)`, className: 'text-emerald-700', dot: 'bg-emerald-500' };
};

const getUrgencyCardClasses = (urgency: RelationshipUrgency) => {
  if (urgency === 'overdue') {
    return {
      cardClassName: 'border-red-300 bg-red-50/60 shadow-[0_0_0_1px_rgba(239,68,68,0.08)]',
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      pulse: true
    };
  }
  if (urgency === 'due_soon') {
    return {
      cardClassName: 'border-amber-300 bg-amber-50/60',
      icon: <Clock3 className="h-4 w-4 text-amber-600" />,
      pulse: false
    };
  }
  if (urgency === 'upcoming') {
    return {
      cardClassName: 'border-emerald-300 bg-emerald-50/50',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      pulse: false
    };
  }
  return {
    cardClassName: 'border-slate-300 bg-white',
    icon: <Clock3 className="h-4 w-4 text-slate-500" />,
    pulse: false
  };
};

const getUpcomingEvent = (events: RelationshipEvent[]) => {
  if (events.length === 0) return null;
  const today = startOfLocalDay(new Date());

  const normalized = events.map((event) => ({ event, date: startOfLocalDay(parseIsoLikeDate(event.eventDate)) }));
  const future = normalized
    .filter((entry) => entry.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (future.length > 0) return future[0].event;

  const fallback = normalized.sort((a, b) => b.date.getTime() - a.date.getTime());
  return fallback[0]?.event || null;
};

export const formatDateTimeInput = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const BirthdayInfo = ({ person }: { person: RelationshipPerson }) => {
  const { birthdayDate, birthdayMonth, birthdayDay } = person;

  if (birthdayDate) return <span>{birthdayDate}</span>;
  if (birthdayMonth && birthdayDay) {
    return <span>{`${birthdayDay.toString().padStart(2, '0')}/${birthdayMonth.toString().padStart(2, '0')}`}</span>;
  }
  return <span className="text-gray-500">Sin registrar</span>;
};

export const RelationshipsHeaderBar = ({
  status,
  activeFilters,
  onToggleFilter,
  showArchived,
  onToggleArchived,
  searchQuery,
  onSearchChange,
  onCreateContact,
  onCreateCircle
}: {
  status: string;
  activeFilters: RelationshipsFilterKey[];
  onToggleFilter: (filter: RelationshipsFilterKey) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateContact: () => void;
  onCreateCircle: () => void;
}) => (
  <Card className="border-2 border-slate-200">
    <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Relaciones</h2>
          {status !== 'idle' && status !== 'error' && (
            <p className="text-xs text-slate-500">
              {status === 'loading' ? 'Cargando...' : status === 'saving' ? 'Guardando...' : status}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative min-w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o apodo"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeFilters.includes('overdue') ? 'default' : 'outline'}
            onClick={() => onToggleFilter('overdue')}
            className={activeFilters.includes('overdue') ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            Vencidos
          </Button>
          <Button
            size="sm"
            variant={activeFilters.includes('events_week') ? 'default' : 'outline'}
            onClick={() => onToggleFilter('events_week')}
            className={activeFilters.includes('events_week') ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Eventos esta semana
          </Button>
          <Button
            size="sm"
            variant={activeFilters.includes('no_next_contact') ? 'default' : 'outline'}
            onClick={() => onToggleFilter('no_next_contact')}
            className={activeFilters.includes('no_next_contact') ? 'bg-slate-700 hover:bg-slate-800' : ''}
          >
            Sin próximo contacto
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="outline" onClick={onToggleArchived}>
          {showArchived ? 'Ocultar archivados' : 'Mostrar archivados'}
        </Button>
        <Button variant="outline" onClick={onCreateCircle}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo círculo
        </Button>
        <Button onClick={onCreateContact}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const CirclesSidebar = ({
  circles,
  selectedCircleId,
  counts,
  overdueCounts,
  onSelectCircle,
  onAddCircle,
  onEditCircle,
  onDeleteCircle
}: {
  circles: Circle[];
  selectedCircleId: string | 'all';
  counts: Record<string, number>;
  overdueCounts: Record<string, number>;
  onSelectCircle: (id: string) => void;
  onAddCircle: () => void;
  onEditCircle: (circle: Circle) => void;
  onDeleteCircle: (circle: Circle) => void;
}) => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">Círculos</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <button
        type="button"
        onClick={() => onSelectCircle('all')}
        className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
          selectedCircleId === 'all'
            ? 'border-sky-500 bg-sky-50 text-sky-900'
            : 'border-slate-200 hover:bg-slate-50'
        }`}
      >
        <div className="font-medium text-sm">Todos los círculos</div>
        <div className="text-xs text-slate-500">{Object.values(counts).reduce((acc, value) => acc + value, 0)} contactos</div>
      </button>

      {circles.map((circle) => (
        <div
          key={circle.id}
          className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${
            selectedCircleId === circle.id
              ? 'border-sky-500 bg-sky-50 text-sky-900'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <button type="button" onClick={() => onSelectCircle(circle.id)} className="w-full text-left">
            <div className="font-medium text-sm flex items-center justify-between gap-2">
              <span>{circle.name}</span>
              {(overdueCounts[circle.id] || 0) > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                  {overdueCounts[circle.id]}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">{counts[circle.id] || 0} contactos</div>
          </button>
          <div className="mt-2 flex gap-1">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onEditCircle(circle)}>
              Editar
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onDeleteCircle(circle)}>
              Eliminar
            </Button>
          </div>
        </div>
      ))}
      <Button className="w-full mt-3" variant="outline" onClick={onAddCircle}>
        <Plus className="h-4 w-4 mr-1" />
        Agregar círculo
      </Button>
    </CardContent>
  </Card>
);

export const RelationshipSummaryCard = ({
  person,
  upcomingEvent,
  onOpen
}: {
  person: RelationshipPerson;
  upcomingEvent: RelationshipEvent | null;
  onOpen: () => void;
}) => {
  const nextStatus = getNextContactStatus(person.nextContactSuggestedAt);
  const urgencyVisual = getUrgencyCardClasses(nextStatus.urgency);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-2xl border text-left p-4 hover:shadow-md transition-shadow ${urgencyVisual.cardClassName}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">{person.fullName}</h4>
          {person.nickname && <p className="text-sm text-slate-500">"{person.nickname}"</p>}
        </div>
        <Badge variant="outline">{RELATIONSHIP_CATEGORY_LABELS[person.category]}</Badge>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>Último contacto: {getLastContactLabel(person.lastContactAt)}</span>
        </div>

        <div className={`flex items-center gap-2 ${nextStatus.className}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${nextStatus.dot} ${urgencyVisual.pulse ? 'animate-pulse' : ''}`} />
          {urgencyVisual.icon}
          <span>Próximo contacto: {nextStatus.label}</span>
        </div>

        <div className="flex items-center gap-2 text-amber-700">
          <Bell className="h-4 w-4" />
          <span>
            Evento próximo:{' '}
            {upcomingEvent ? `${upcomingEvent.title} (${formatDate(upcomingEvent.eventDate)})` : 'Sin eventos'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <MessageCircle className="h-4 w-4" />
          <span>{person.notes.length} notas registradas</span>
        </div>
      </div>
    </button>
  );
};

export const CircleSection = ({
  circle,
  people,
  eventsByRelationship,
  onOpenPerson
}: {
  circle: Circle;
  people: RelationshipPerson[];
  eventsByRelationship: Record<string, RelationshipEvent[]>;
  onOpenPerson: (personId: string) => void;
}) => {
  if (people.length === 0) return null;

  return (
    <Card className="border-slate-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span className="h-3 w-3 rounded-full bg-sky-500" />
          <span>{circle.name}</span>
          {circle.contactFrequencyDays && (
            <span className="text-base font-normal text-slate-500">
              (Contacto cada {circle.contactFrequencyDays} días)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {people.map((person) => (
            <RelationshipSummaryCard
              key={person.id}
              person={person}
              upcomingEvent={getUpcomingEvent((eventsByRelationship[person.id] || []).filter((event) => !event.isArchived))}
              onOpen={() => onOpenPerson(person.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const RelationshipHeaderCard = ({
  person,
  onArchiveToggle,
  onUpdateContactDates
}: {
  person: RelationshipPerson;
  onArchiveToggle: (archived: boolean) => Promise<void>;
  onUpdateContactDates: (input: { lastContactAt?: string; nextContactSuggestedAt?: string }) => Promise<void>;
}) => {
  const lastContactInputRef = useRef<HTMLInputElement | null>(null);
  const nextContactInputRef = useRef<HTMLInputElement | null>(null);

  const onSaveDates = async () => {
    const lastContactValue = lastContactInputRef.current?.value || '';
    const nextContactValue = nextContactInputRef.current?.value || '';

    await onUpdateContactDates({
      lastContactAt: toIsoFromInput(lastContactValue),
      nextContactSuggestedAt: toIsoFromInput(nextContactValue)
    });
  };

  return (
    <div className="rounded border border-gray-200 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold flex items-center gap-2">
            {person.fullName}
            {person.isArchived && <Badge variant="outline">Archivado</Badge>}
          </div>
          <div className="text-sm text-gray-500">{person.nickname || 'Sin apodo'}</div>
        </div>
        <Button
          variant={person.isArchived ? 'default' : 'outline'}
          onClick={() => onArchiveToggle(!person.isArchived)}
        >
          {person.isArchived ? 'Desarchivar' : 'Archivar'}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs text-gray-600">Último contacto</label>
        <Input
          key={`last-contact-${person.id}`}
          ref={lastContactInputRef}
          type="datetime-local"
          defaultValue={formatDateTimeInput(person.lastContactAt)}
        />
        <label className="text-xs text-gray-600">Próximo contacto sugerido</label>
        <Input
          key={`next-contact-${person.id}`}
          ref={nextContactInputRef}
          type="datetime-local"
          defaultValue={formatDateTimeInput(person.nextContactSuggestedAt)}
        />
        <Button onClick={onSaveDates}>Guardar fechas de contacto</Button>
      </div>
    </div>
  );
};

export const RelationshipNotesCard = ({
  person,
  onAppendNote
}: {
  person: RelationshipPerson;
  onAppendNote: (text: string) => Promise<void>;
}) => {
  const [noteText, setNoteText] = useState('');

  const onAdd = async () => {
    if (!noteText.trim()) return;
    await onAppendNote(noteText.trim());
    setNoteText('');
  };

  return (
    <div className="rounded border border-gray-200 p-3 space-y-2">
      <h3 className="font-semibold">Notas (append-only)</h3>
      <Textarea placeholder="Agregar nota" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
      <Button onClick={onAdd}>Agregar nota</Button>
      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
        {(person.notes || []).slice().reverse().map((note, idx) => (
          <div key={`${note.timestamp}-${idx}`} className="rounded bg-gray-50 p-2 text-sm">
            <div className="text-xs text-gray-500">{new Date(note.timestamp).toLocaleString()}</div>
            <div>{note.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RelationshipEventsCard = ({
  events,
  onAddEvent,
  onToggleArchived
}: {
  events: RelationshipEvent[];
  onAddEvent: (input: {
    title: string;
    eventType: RelationshipEventType;
    eventDate: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  onToggleArchived: (eventId: string, archived: boolean) => Promise<void>;
}) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<RelationshipEventType>(RELATIONSHIP_EVENT_TYPES.CUSTOM);
  const [eventDate, setEventDate] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');

  const onAdd = async () => {
    if (!eventTitle.trim() || !eventDate) return;
    await onAddEvent({
      title: eventTitle,
      eventType,
      eventDate,
      startDate: eventStartDate || undefined,
      endDate: eventEndDate || undefined
    });

    setEventTitle('');
    setEventType(RELATIONSHIP_EVENT_TYPES.CUSTOM);
    setEventDate('');
    setEventStartDate('');
    setEventEndDate('');
  };

  return (
    <div className="rounded border border-gray-200 p-3 space-y-2">
      <h3 className="font-semibold">Eventos</h3>
      <Input placeholder="Título" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
      <select
        value={eventType}
        onChange={(e) => setEventType(e.target.value as RelationshipEventType)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        {Object.values(RELATIONSHIP_EVENT_TYPES).map((value) => (
          <option key={value} value={value}>{RELATIONSHIP_EVENT_TYPE_LABELS[value]}</option>
        ))}
      </select>
      <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} />
        <Input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} />
      </div>
      <Button onClick={onAdd}>Agregar evento</Button>

      <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
        {events.map((event) => (
          <div key={event.id} className="rounded bg-gray-50 p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-gray-500">
                  {RELATIONSHIP_EVENT_TYPE_LABELS[event.eventType]} - {event.eventDate}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onToggleArchived(event.id, !event.isArchived)}>
                {event.isArchived ? 'Desarchivar' : 'Archivar'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RelationshipTasksCard = ({
  tasks,
  availablePrivateTasks,
  onCreateTask,
  onLinkExistingTask,
  onUnlinkTask
}: {
  tasks: RelatedTask[];
  availablePrivateTasks: RelatedTask[];
  onCreateTask: (input: { title: string; category?: string; isPrivate?: boolean }) => Promise<void>;
  onLinkExistingTask: (taskId: string) => Promise<void>;
  onUnlinkTask: (taskId: string) => Promise<void>;
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskIsPrivate, setTaskIsPrivate] = useState(true);
  const [taskCategory, setTaskCategory] = useState('social');
  const [selectedPrivateTaskId, setSelectedPrivateTaskId] = useState('');

  const onCreate = async () => {
    if (!taskTitle.trim()) return;
    await onCreateTask({ title: taskTitle, category: taskCategory, isPrivate: taskIsPrivate });
    setTaskTitle('');
    setTaskCategory('social');
    setTaskIsPrivate(true);
  };

  const onLink = async () => {
    if (!selectedPrivateTaskId) return;
    await onLinkExistingTask(selectedPrivateTaskId);
    setSelectedPrivateTaskId('');
  };

  return (
    <div className="rounded border border-gray-200 p-3 space-y-2">
      <h3 className="font-semibold">Tareas relacionadas</h3>
      <Input placeholder="Nueva tarea" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
      <Input placeholder="Categoría (task.category)" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={taskIsPrivate} onChange={(e) => setTaskIsPrivate(e.target.checked)} />
        Privada (por defecto activa)
      </label>
      <Button onClick={onCreate}>Crear tarea y vincular</Button>

      <div className="flex gap-2">
        <select
          value={selectedPrivateTaskId}
          onChange={(e) => setSelectedPrivateTaskId(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Vincular tarea privada existente...</option>
          {availablePrivateTasks.map((task) => (
            <option key={task.id} value={task.id}>{task.title}</option>
          ))}
        </select>
        <Button variant="outline" onClick={onLink}>Vincular</Button>
      </div>

      <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <div key={task.id} className="rounded bg-gray-50 p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{task.title}</div>
                <div className="text-xs text-gray-500">
                  {task.completed ? 'Completada' : 'Activa'} | {task.isPrivate ? 'Privada' : 'No privada'}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => onUnlinkTask(task.id)}>Desvincular</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const useEffectiveCircle = (
  circles: Circle[],
  selectedCircleId: string | 'all'
) => {
  const effectiveSelectedCircleId = useMemo(() => {
    if (selectedCircleId === 'all') return 'all';
    if (circles.some((circle) => circle.id === selectedCircleId)) {
      return selectedCircleId;
    }
    return 'all';
  }, [selectedCircleId, circles]);

  return {
    effectiveSelectedCircleId
  };
};
