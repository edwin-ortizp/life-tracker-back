import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckSquare,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Users
} from 'lucide-react';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction } from '@/shared/components/module-views/types';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { paths } from '@/core/routes/paths';
import { useRelationshipsData } from '@/modules/relationships/controllers/useRelationshipsData.supabase';
import {
  RELATIONSHIP_CATEGORIES,
  RELATIONSHIP_CATEGORY_LABELS,
  RELATIONSHIP_EVENT_TYPE_LABELS,
  RELATIONSHIP_EVENT_TYPES,
  type RelationshipCategory,
  type RelationshipEventType,
  type RelationshipPerson
} from '@/modules/relationships/models';
import { getDaysFromToday, parseIsoLikeDate } from '@/modules/relationships/utils/urgency';
import { CATEGORY_LABELS, TASK_CATEGORIES, type TaskCategory } from '@/modules/task/models';

const formatDate = (isoLike?: string) => {
  if (!isoLike) return 'Sin fecha';
  return parseIsoLikeDate(isoLike).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (isoLike?: string) => {
  if (!isoLike) return 'Sin fecha';
  return parseIsoLikeDate(isoLike).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatBirthday = (person: RelationshipPerson) => {
  if (person.birthdayDate) return formatDate(person.birthdayDate);
  if (person.birthdayMonth && person.birthdayDay) {
    return `${person.birthdayDay.toString().padStart(2, '0')}/${person.birthdayMonth.toString().padStart(2, '0')}`;
  }
  return 'Sin registro';
};

const getNextContactTone = (isoLike?: string) => {
  const days = getDaysFromToday(isoLike);
  if (days === null) return { className: 'text-slate-500', label: 'Sin definir' };
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      className: 'text-red-600',
      label: `${formatDate(isoLike)} (vencido ${overdueDays} día${overdueDays === 1 ? '' : 's'})`
    };
  }
  if (days === 0) return { className: 'text-amber-600', label: `${formatDate(isoLike)} (hoy)` };
  return { className: 'text-blue-600', label: `${formatDate(isoLike)} (en ${days} día${days === 1 ? '' : 's'})` };
};

const toDateInput = (isoLike?: string) => {
  if (!isoLike) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoLike)) return isoLike;
  const date = parseIsoLikeDate(isoLike);
  return date.toISOString().slice(0, 10);
};

const toDatetimeLocalInput = (isoLike?: string) => {
  if (!isoLike) return '';
  const date = parseIsoLikeDate(isoLike);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const addDays = (input: Date, days: number) => {
  const next = new Date(input);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfLocalDay = (input: Date) => new Date(input.getFullYear(), input.getMonth(), input.getDate());

const toLocalDateTime = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getHumanDateHint = (value: string, mode: 'last' | 'next') => {
  const parsed = toLocalDateTime(value);
  if (!parsed) return mode === 'next' ? 'Sin fecha definida' : 'Sin registro';

  const daysDiff = Math.floor((startOfLocalDay(parsed).getTime() - startOfLocalDay(new Date()).getTime()) / 86400000);
  const weekday = parsed.toLocaleDateString('es-CO', { weekday: 'long' });

  if (daysDiff === 0) return 'hoy';
  if (daysDiff === -1) return 'ayer';
  if (daysDiff === 1) return mode === 'next' ? `mañana - ${weekday}` : 'mañana';
  if (daysDiff < 0) return `hace ${Math.abs(daysDiff)} días`;
  return `en ${daysDiff} días - ${weekday}`;
};

const averageFrequencyDays = (timestamps: string[]) => {
  if (timestamps.length < 2) return null;

  const sorted = timestamps
    .map((value) => new Date(value).getTime())
    .sort((a, b) => a - b);

  let totalDays = 0;
  let segments = 0;

  for (let i = 1; i < sorted.length; i += 1) {
    const diff = sorted[i] - sorted[i - 1];
    if (diff > 0) {
      totalDays += diff / 86400000;
      segments += 1;
    }
  }

  if (segments === 0) return null;
  return Math.max(1, Math.round(totalDays / segments));
};

const RelationshipDetailPage = () => {
  const navigate = useNavigate();
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const [searchParams] = useSearchParams();

  const {
    isLoaded,
    error,
    circles,
    getRelationshipById,
    events,
    getRelatedTasks,
    getAvailablePrivateTasks,
    updateRelationship,
    setRelationshipArchived,
    addNoteWithContactUpdate,
    updateNote,
    addEvent,
    setEventArchived,
    linkExistingTask,
    unlinkTask,
    createRelatedTask
  } = useRelationshipsData();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editCategory, setEditCategory] = useState<RelationshipCategory>(RELATIONSHIP_CATEGORIES.SOCIAL);
  const [editCircleId, setEditCircleId] = useState('');
  const [editBirthdayDate, setEditBirthdayDate] = useState('');
  const [editBirthdayMonth, setEditBirthdayMonth] = useState('');
  const [editBirthdayDay, setEditBirthdayDay] = useState('');
  const [editLastContactAt, setEditLastContactAt] = useState('');
  const [editNextContactAt, setEditNextContactAt] = useState('');

  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<RelationshipEventType>(RELATIONSHIP_EVENT_TYPES.CUSTOM);
  const [eventDate, setEventDate] = useState('');

  const [noteText, setNoteText] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState('');
  const [noteLastContactAt, setNoteLastContactAt] = useState('');
  const [noteNextContactAt, setNoteNextContactAt] = useState('');
  const [noteInlineError, setNoteInlineError] = useState<string | null>(null);

  const [editNoteIndex, setEditNoteIndex] = useState<number>(-1);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteTimestamp, setEditNoteTimestamp] = useState('');
  const [editNoteInlineError, setEditNoteInlineError] = useState<string | null>(null);

  const [taskTab, setTaskTab] = useState('new');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>(TASK_CATEGORIES.SOCIAL);
  const [taskPrivate, setTaskPrivate] = useState(true);
  const [selectedExistingTask, setSelectedExistingTask] = useState('');

  const person = relationshipId ? getRelationshipById(relationshipId) : undefined;
  const currentCircle = circles.find((circle) => circle.id === person?.circleId);

  const backQuery = useMemo(() => {
    const params = new URLSearchParams();
    const circle = searchParams.get('circle') || person?.circleId;
    const archived = searchParams.get('archived') || '0';

    if (circle) params.set('circle', circle);
    params.set('archived', archived);

    return params.toString();
  }, [searchParams, person?.circleId]);

  useEffect(() => {
    if (isLoaded && !person) {
      navigate(`${paths.relationships.index}?notFound=1`, { replace: true });
    }
  }, [isLoaded, person, navigate]);

  if (isLoaded && !person) return null;

  if (!person) {
    return (
      <ModuleViewLayout
        title="Relaciones"
        subtitle="Cargando contacto"
        icon={<Users className="h-4 w-4 text-white" />}
      >
        <div className="py-4">
          <Card>
            <CardContent className="p-6 text-sm text-gray-600">Cargando...</CardContent>
          </Card>
        </div>
      </ModuleViewLayout>
    );
  }

  const personEvents = events
    .filter((event) => event.relationshipId === person.id)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  const relatedTasks = getRelatedTasks(person.id);
  const availablePrivateTasks = getAvailablePrivateTasks(person.id);

  const nextContactState = getNextContactTone(person.nextContactSuggestedAt);
  const daysWithoutContact = person.lastContactAt
    ? Math.max(0, Math.abs(getDaysFromToday(person.lastContactAt) || 0))
    : null;

  const upcomingEventsCount = personEvents.filter((event) => {
    if (event.isArchived) return false;
    const days = getDaysFromToday(event.eventDate);
    return days !== null && days >= 0;
  }).length;

  const avgFreq = averageFrequencyDays(person.notes.map((note) => note.timestamp));

  const onOpenEdit = () => {
    setEditName(person.fullName);
    setEditNickname(person.nickname || '');
    setEditCategory(person.category);
    setEditCircleId(person.circleId);
    setEditBirthdayDate(toDateInput(person.birthdayDate));
    setEditBirthdayMonth(person.birthdayMonth ? String(person.birthdayMonth) : '');
    setEditBirthdayDay(person.birthdayDay ? String(person.birthdayDay) : '');
    setEditLastContactAt(toDatetimeLocalInput(person.lastContactAt));
    setEditNextContactAt(toDatetimeLocalInput(person.nextContactSuggestedAt));
    setIsEditOpen(true);
  };

  const onSaveEdit = async () => {
    await updateRelationship(person.id, {
      fullName: editName,
      nickname: editNickname || undefined,
      category: editCategory,
      circleId: editCircleId || person.circleId,
      birthdayDate: editBirthdayDate || undefined,
      birthdayMonth: editBirthdayMonth ? Number(editBirthdayMonth) : undefined,
      birthdayDay: editBirthdayDay ? Number(editBirthdayDay) : undefined,
      lastContactAt: editLastContactAt ? new Date(editLastContactAt).toISOString() : undefined,
      nextContactSuggestedAt: editNextContactAt ? new Date(editNextContactAt).toISOString() : undefined
    });

    setIsEditOpen(false);
  };

  const onAddEvent = async () => {
    if (!eventTitle.trim() || !eventDate) return;

    await addEvent({
      relationshipId: person.id,
      title: eventTitle,
      eventType,
      eventDate
    });

    setEventTitle('');
    setEventType(RELATIONSHIP_EVENT_TYPES.CUSTOM);
    setEventDate('');
    setIsEventOpen(false);
  };

  const onOpenNoteDialog = () => {
    const now = new Date();
    const nowLocalInput = toDatetimeLocalInput(now.toISOString());
    const lastContactDefault = nowLocalInput;

    let nextContactDefault = '';
    const contactFrequencyDays = currentCircle?.contactFrequencyDays;
    if (contactFrequencyDays && contactFrequencyDays > 0) {
      nextContactDefault = toDatetimeLocalInput(addDays(now, contactFrequencyDays).toISOString());
    } else if (person.nextContactSuggestedAt) {
      nextContactDefault = toDatetimeLocalInput(person.nextContactSuggestedAt);
    }

    setNoteInlineError(null);
    setNoteText('');
    setNoteTimestamp(nowLocalInput);
    setNoteLastContactAt(lastContactDefault);
    setNoteNextContactAt(nextContactDefault);
    setIsNoteOpen(true);
  };

  const onAddNote = async () => {
    if (!noteText.trim()) {
      setNoteInlineError('La nota es obligatoria.');
      return;
    }

    setNoteInlineError(null);

    try {
      await addNoteWithContactUpdate(person.id, {
        text: noteText.trim(),
        timestamp: noteTimestamp ? new Date(noteTimestamp).toISOString() : undefined,
        lastContactAt: noteLastContactAt ? new Date(noteLastContactAt).toISOString() : undefined,
        nextContactSuggestedAt: noteNextContactAt ? new Date(noteNextContactAt).toISOString() : undefined
      });

      setNoteText('');
      setNoteTimestamp('');
      setNoteLastContactAt('');
      setNoteNextContactAt('');
      setIsNoteOpen(false);
    } catch {
      setNoteInlineError('No se pudo guardar la nota con las fechas de contacto.');
    }
  };

  const onOpenEditNoteDialog = (noteIndex: number) => {
    const note = person.notes[noteIndex];
    if (!note) return;

    setEditNoteIndex(noteIndex);
    setEditNoteText(note.text);
    setEditNoteTimestamp(toDatetimeLocalInput(note.timestamp));
    setEditNoteInlineError(null);
    setIsEditNoteOpen(true);
  };

  const onSaveEditNote = async () => {
    if (!editNoteText.trim()) {
      setEditNoteInlineError('La nota es obligatoria.');
      return;
    }

    setEditNoteInlineError(null);

    try {
      await updateNote(person.id, {
        noteIndex: editNoteIndex,
        text: editNoteText.trim(),
        timestamp: editNoteTimestamp ? new Date(editNoteTimestamp).toISOString() : new Date().toISOString()
      });

      setEditNoteIndex(-1);
      setEditNoteText('');
      setEditNoteTimestamp('');
      setIsEditNoteOpen(false);
    } catch {
      setEditNoteInlineError('No se pudo actualizar la nota.');
    }
  };

  const onCreateTask = async () => {
    if (!taskTitle.trim()) return;

    await createRelatedTask(
      person.id,
      {
        title: taskTitle,
        category: taskCategory,
        isPrivate: taskPrivate
      },
      true
    );

    setTaskTitle('');
    setTaskCategory(TASK_CATEGORIES.SOCIAL);
    setTaskPrivate(true);
    setIsTaskOpen(false);
  };

  const onLinkTask = async () => {
    if (!selectedExistingTask) return;

    await linkExistingTask(person.id, selectedExistingTask);
    setSelectedExistingTask('');
    setIsTaskOpen(false);
  };

  const actions: ModuleViewAction[] = [
    {
      id: 'back',
      label: 'Volver',
      icon: <ArrowLeft className="h-4 w-4" />,
      onClick: () => navigate(`${paths.relationships.index}?${backQuery}`),
      showLabel: true
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: <Pencil className="h-4 w-4" />,
      onClick: onOpenEdit,
      showLabel: true
    }
  ];

  return (
    <ModuleViewLayout
      title="Relaciones"
      subtitle="Ficha de contacto"
      icon={<Users className="h-4 w-4 text-white" />}
      actions={actions}
    >
      <div className="py-4 space-y-4">
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-3 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <Card className="border-2 border-slate-300 bg-sky-50/40">
          <CardContent className="p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{person.fullName}</h1>
              <Badge variant="outline" className="text-sm px-3 py-1 border-red-400 text-red-600 bg-red-50">
                {RELATIONSHIP_CATEGORY_LABELS[person.category]}
              </Badge>
              {currentCircle && (
                <Badge variant="outline" className="text-sm px-3 py-1 border-blue-500 text-blue-700 bg-blue-50">
                  {currentCircle.name}
                  {currentCircle.contactFrequencyDays ? ` · cada ${currentCircle.contactFrequencyDays} días` : ''}
                </Badge>
              )}
              {person.isArchived && <Badge variant="destructive">Archivado</Badge>}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
          <Card className="border-slate-300">
            <CardContent className="p-4 space-y-6">
              <section className="space-y-3">
                <h3 className="text-2xl font-semibold text-slate-900">Información de contacto</h3>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Nombre</span>
                    <span className="font-medium text-slate-900 text-right">{person.fullName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Apodo</span>
                    <span className="font-medium text-slate-900 text-right">{person.nickname || 'Sin apodo'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Categoría</span>
                    <span className="font-medium text-slate-900 text-right">{RELATIONSHIP_CATEGORY_LABELS[person.category]}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Cumpleaños</span>
                    <span className="font-medium text-slate-900 text-right">{formatBirthday(person)}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-2xl font-semibold text-slate-900">Fechas importantes</h3>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="text-slate-700">
                    Último contacto: {person.lastContactAt ? `${formatDate(person.lastContactAt)} (hace ${daysWithoutContact ?? 0} días)` : 'Sin registro'}
                  </div>
                  <div className={nextContactState.className}>Próximo contacto: {nextContactState.label}</div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Estadísticas
                </h3>
                <div className="grid grid-cols-2 gap-3 border-t pt-3">
                  <div className="rounded-xl border border-blue-300 bg-blue-50 p-3">
                    <div className="text-xs text-slate-500">Total interacciones</div>
                    <div className="text-3xl font-bold text-blue-700">{person.notes.length}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                    <div className="text-xs text-slate-500">Frecuencia promedio (notas)</div>
                    <div className="text-3xl font-bold text-emerald-700">{avgFreq ? `${avgFreq} días` : '-'}</div>
                  </div>
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
                    <div className="text-xs text-slate-500">Días sin contacto</div>
                    <div className="text-3xl font-bold text-amber-700">{daysWithoutContact ?? '-'}</div>
                  </div>
                  <div className="rounded-xl border border-violet-300 bg-violet-50 p-3">
                    <div className="text-xs text-slate-500">Eventos próximos</div>
                    <div className="text-3xl font-bold text-violet-700">{upcomingEventsCount}</div>
                  </div>
                </div>
              </section>

              <Button
                variant={person.isArchived ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setRelationshipArchived(person.id, !person.isArchived)}
              >
                {person.isArchived ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Desarchivar contacto
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Archivar contacto
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-300">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-2">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-2xl font-semibold text-slate-700">
                    <span>🎉</span>
                    <span>Eventos</span>
                  </div>
                  <Button onClick={() => setIsEventOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Evento
                  </Button>
                </div>

                <div className="space-y-3">
                  {personEvents.length === 0 && <div className="text-sm text-slate-500">Sin eventos registrados.</div>}

                  {personEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-900">{event.title}</div>
                          <div className="text-sm text-slate-500">
                            {RELATIONSHIP_EVENT_TYPE_LABELS[event.eventType]} - {formatDate(event.eventDate)}
                          </div>
                          {event.isArchived && <Badge variant="outline" className="mt-1">Archivado</Badge>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setEventArchived(event.id, !event.isArchived)}>
                          {event.isArchived ? 'Desarchivar' : 'Archivar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-300">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-2">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-blue-500 bg-blue-50 px-4 py-2 text-2xl font-semibold text-blue-700">
                    <MessageCircle className="h-5 w-5" />
                    <span>Comentarios</span>
                  </div>
                  <Button onClick={onOpenNoteDialog} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Nota
                  </Button>
                </div>

                <div className="space-y-3">
                  {person.notes.length === 0 && <div className="text-sm text-slate-500">Sin notas registradas.</div>}

                  {person.notes.slice().reverse().map((note, idx) => {
                    const originalIndex = person.notes.length - 1 - idx;
                    return (
                      <div key={`${note.timestamp}-${idx}`} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-sm text-slate-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDateTime(note.timestamp)}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpenEditNoteDialog(originalIndex)}
                            className="h-7 px-2"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                        <div className="text-lg leading-relaxed whitespace-pre-wrap text-slate-900">{note.text}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-300">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-2">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-2xl font-semibold text-slate-700">
                    <CheckSquare className="h-5 w-5" />
                    <span>Tareas relacionadas</span>
                  </div>
                  <Button onClick={() => setIsTaskOpen(true)} className="bg-black text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Tarea
                  </Button>
                </div>

                <div className="space-y-3">
                  {relatedTasks.length === 0 && <div className="text-sm text-slate-500">Sin tareas relacionadas.</div>}

                  {relatedTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-900">{task.title}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant={task.completed ? 'secondary' : 'outline'}>
                              {task.completed ? 'Completada' : 'Activa'}
                            </Badge>
                            <Badge variant="outline">{task.isPrivate ? 'Privada' : 'No privada'}</Badge>
                            {task.category && (
                              <Badge variant="outline">{CATEGORY_LABELS[task.category as TaskCategory] || task.category}</Badge>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => unlinkTask(person.id, task.id)}>
                          Desvincular
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Perfil</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-name">Nombre completo</Label>
                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-nickname">Apodo</Label>
                    <Input id="edit-nickname" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Categoría</Label>
                    <Select value={editCategory} onValueChange={(value) => setEditCategory(value as RelationshipCategory)}>
                      <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(RELATIONSHIP_CATEGORIES).map((category) => (
                          <SelectItem key={category} value={category}>
                            {RELATIONSHIP_CATEGORY_LABELS[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Círculo</Label>
                    <Select value={editCircleId} onValueChange={setEditCircleId}>
                      <SelectTrigger><SelectValue placeholder="Círculo" /></SelectTrigger>
                      <SelectContent>
                        {circles.map((circle) => (
                          <SelectItem key={circle.id} value={circle.id}>{circle.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cumpleaños</h4>
                <div className="space-y-1">
                  <Label htmlFor="edit-birthday-date">Fecha completa (si la conoces)</Label>
                  <Input
                    id="edit-birthday-date"
                    type="date"
                    value={editBirthdayDate}
                    onChange={(e) => setEditBirthdayDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-birthday-month">Mes</Label>
                    <Input
                      id="edit-birthday-month"
                      type="number"
                      min={1}
                      max={12}
                      value={editBirthdayMonth}
                      onChange={(e) => setEditBirthdayMonth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-birthday-day">Día</Label>
                    <Input
                      id="edit-birthday-day"
                      type="number"
                      min={1}
                      max={31}
                      value={editBirthdayDay}
                      onChange={(e) => setEditBirthdayDay(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Seguimiento de contacto</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-last-contact">Último contacto</Label>
                    <Input
                      id="edit-last-contact"
                      type="datetime-local"
                      value={editLastContactAt}
                      onChange={(e) => setEditLastContactAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-next-contact">Próximo contacto sugerido</Label>
                    <Input
                      id="edit-next-contact"
                      type="datetime-local"
                      value={editNextContactAt}
                      onChange={(e) => setEditNextContactAt(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={onSaveEdit}>Guardar cambios</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventOpen} onOpenChange={setIsEventOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
            <Select value={eventType} onValueChange={(value) => setEventType(value as RelationshipEventType)}>
              <SelectTrigger><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
              <SelectContent>
                {Object.values(RELATIONSHIP_EVENT_TYPES).map((value) => (
                  <SelectItem key={value} value={value}>{RELATIONSHIP_EVENT_TYPE_LABELS[value]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEventOpen(false)}>Cancelar</Button>
              <Button onClick={onAddEvent}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isNoteOpen}
        onOpenChange={(open) => {
          setIsNoteOpen(open);
          if (!open) setNoteInlineError(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Agregar nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Escribe aquí la nota del contacto..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[180px]"
            />
            <div className="space-y-1">
              <Label htmlFor="note-timestamp">Fecha del comentario</Label>
              <Input
                id="note-timestamp"
                type="datetime-local"
                value={noteTimestamp}
                onChange={(e) => setNoteTimestamp(e.target.value)}
              />
              <p className="text-xs text-slate-500">Fecha en la que ocurrió este comentario o interacción</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="note-last-contact">Último contacto</Label>
                <Input
                  id="note-last-contact"
                  type="datetime-local"
                  value={noteLastContactAt}
                  onChange={(e) => setNoteLastContactAt(e.target.value)}
                />
                <p className="text-xs text-slate-500">{getHumanDateHint(noteLastContactAt, 'last')}</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="note-next-contact">Próximo contacto sugerido</Label>
                <Input
                  id="note-next-contact"
                  type="datetime-local"
                  value={noteNextContactAt}
                  onChange={(e) => setNoteNextContactAt(e.target.value)}
                />
                <p className="text-xs text-slate-500">{getHumanDateHint(noteNextContactAt, 'next')}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Calculado por frecuencia del círculo, editable.</p>
            {noteInlineError && <p className="text-sm text-red-600">{noteInlineError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancelar</Button>
              <Button onClick={onAddNote}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditNoteOpen}
        onOpenChange={(open) => {
          setIsEditNoteOpen(open);
          if (!open) setEditNoteInlineError(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Escribe aquí la nota del contacto..."
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              className="min-h-[180px]"
            />
            <div className="space-y-1">
              <Label htmlFor="edit-note-timestamp">Fecha del comentario</Label>
              <Input
                id="edit-note-timestamp"
                type="datetime-local"
                value={editNoteTimestamp}
                onChange={(e) => setEditNoteTimestamp(e.target.value)}
              />
              <p className="text-xs text-slate-500">Fecha en la que ocurrió este comentario o interacción</p>
            </div>
            {editNoteInlineError && <p className="text-sm text-red-600">{editNoteInlineError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditNoteOpen(false)}>Cancelar</Button>
              <Button onClick={onSaveEditNote}>Guardar cambios</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tareas relacionadas</DialogTitle>
          </DialogHeader>

          <Tabs value={taskTab} onValueChange={setTaskTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Crear tarea</TabsTrigger>
              <TabsTrigger value="link">Vincular existente</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="task-title">Título</Label>
                    <Input
                      id="task-title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Nueva tarea..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Categoría</Label>
                      <Select value={taskCategory} onValueChange={(value) => setTaskCategory(value as TaskCategory)}>
                        <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                        <SelectContent>
                          {Object.values(TASK_CATEGORIES).map((value) => (
                            <SelectItem key={value} value={value}>{CATEGORY_LABELS[value]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="task-private" className="text-sm font-medium">Privada</Label>
                        <Switch id="task-private" checked={taskPrivate} onCheckedChange={setTaskPrivate} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Desde Relaciones se crea privada por defecto, pero puedes cambiarlo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTaskOpen(false)}>Cancelar</Button>
                <Button onClick={onCreateTask} className="bg-black text-white hover:bg-gray-800">Crear y vincular</Button>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <Label>Tarea privada existente</Label>
                    <Select value={selectedExistingTask} onValueChange={setSelectedExistingTask}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una tarea privada" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePrivateTasks.length === 0 ? (
                          <SelectItem value="none" disabled>No hay tareas privadas disponibles</SelectItem>
                        ) : (
                          availablePrivateTasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTaskOpen(false)}>Cancelar</Button>
                <Button onClick={onLinkTask} disabled={!selectedExistingTask || selectedExistingTask === 'none'}>
                  Vincular tarea
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </ModuleViewLayout>
  );
};

export default RelationshipDetailPage;
