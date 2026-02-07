import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { generateTaskCode } from '@/shared/utils/taskCode';
import { RelationshipsService } from '@/modules/relationships/services/RelationshipsService';
import type {
  Circle,
  RelatedTask,
  RelationshipCreateInput,
  RelationshipEvent,
  RelationshipEventType,
  RelationshipNoteEntry,
  RelationshipPerson,
  RelationshipTaskCreateInput,
  RelationshipTaskLink
} from '@/modules/relationships/models';

const mapCircle = (row: any): Circle => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  sortOrder: row.sort_order ?? 0,
  contactFrequencyDays: row.contact_frequency_days ?? undefined,
  description: row.description ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined
});

const mapRelationship = (row: any): RelationshipPerson => ({
  id: row.id,
  userId: row.user_id,
  circleId: row.circle_id,
  fullName: row.full_name,
  nickname: row.nickname ?? undefined,
  category: row.category,
  birthdayDate: row.birthday_date ?? undefined,
  birthdayMonth: row.birthday_month ?? undefined,
  birthdayDay: row.birthday_day ?? undefined,
  lastContactAt: row.last_contact_at ?? undefined,
  nextContactSuggestedAt: row.next_contact_suggested_at ?? undefined,
  notes: Array.isArray(row.notes) ? row.notes : [],
  isArchived: !!row.is_archived,
  archivedAt: row.archived_at ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined
});

const mapEvent = (row: any): RelationshipEvent => ({
  id: row.id,
  userId: row.user_id,
  relationshipId: row.relationship_id,
  title: row.title,
  eventType: row.event_type,
  eventDate: row.event_date,
  startDate: row.start_date ?? undefined,
  endDate: row.end_date ?? undefined,
  isArchived: !!row.is_archived,
  archivedAt: row.archived_at ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined
});

const mapTaskLink = (row: any): RelationshipTaskLink => ({
  id: row.id,
  userId: row.user_id,
  relationshipId: row.relationship_id,
  taskId: row.task_id,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined
});

const mapTask = (row: any): RelatedTask => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  completed: !!row.completed,
  isPrivate: !!row.is_private,
  category: row.category ?? undefined,
  startDate: row.start_date ?? undefined,
  endDate: row.end_date ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined
});

export const useRelationshipsData = () => {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [relationships, setRelationships] = useState<RelationshipPerson[]>([]);
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [taskLinks, setTaskLinks] = useState<RelationshipTaskLink[]>([]);
  const [tasksById, setTasksById] = useState<Record<string, RelatedTask>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);
    setIsLoaded(false);

    try {
      const [circlesRes, relationshipsRes, eventsRes, linksRes] = await Promise.all([
        RelationshipsService.table('circles')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        RelationshipsService.table('relationships')
          .select('*')
          .eq('user_id', user.id)
          .order('full_name', { ascending: true }),
        RelationshipsService.table('events')
          .select('*')
          .eq('user_id', user.id)
          .order('event_date', { ascending: false }),
        RelationshipsService.table('relationship_tasks')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (circlesRes.error) throw circlesRes.error;
      if (relationshipsRes.error) throw relationshipsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (linksRes.error) throw linksRes.error;

      const nextCircles = (circlesRes.data || []).map(mapCircle);
      const nextRelationships = (relationshipsRes.data || []).map(mapRelationship);
      const nextEvents = (eventsRes.data || []).map(mapEvent);
      const nextLinks = (linksRes.data || []).map(mapTaskLink);

      const taskIds = Array.from(new Set(nextLinks.map((link: RelationshipTaskLink) => link.taskId)));
      let tasksMap: Record<string, RelatedTask> = {};

      if (taskIds.length > 0) {
        const tasksRes = await RelationshipsService.table('tasks')
          .select('*')
          .eq('user_id', user.id)
          .in('id', taskIds);

        if (tasksRes.error) throw tasksRes.error;

        tasksMap = (tasksRes.data || []).reduce((acc: Record<string, RelatedTask>, row: any) => {
          acc[row.id] = mapTask(row);
          return acc;
        }, {});
      }

      setCircles(nextCircles);
      setRelationships(nextRelationships);
      setEvents(nextEvents);
      setTaskLinks(nextLinks);
      setTasksById(tasksMap);
      setStatus('idle');
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar relaciones');
      setStatus('error');
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCircles([]);
      setRelationships([]);
      setEvents([]);
      setTaskLinks([]);
      setTasksById({});
      setIsLoaded(false);
      return;
    }

    loadAll();
  }, [user, loadAll]);

  const addCircle = useCallback(async (input: { name: string; sortOrder: number; contactFrequencyDays?: number; description?: string }) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const { data, error: insertError } = await RelationshipsService.table('circles')
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          sort_order: input.sortOrder,
          contact_frequency_days: input.contactFrequencyDays || null,
          description: input.description?.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      setCircles((prev) => [...prev, mapCircle(data)].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el círculo');
      setStatus('error');
    }
  }, [user]);

  const updateCircle = useCallback(async (id: string, input: Partial<{ name: string; sortOrder: number; contactFrequencyDays: number; description: string }>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;
      if (input.contactFrequencyDays !== undefined) updateData.contact_frequency_days = input.contactFrequencyDays || null;
      if (input.description !== undefined) updateData.description = input.description?.trim() || null;

      const { data, error: updateError } = await RelationshipsService.table('circles')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      const next = mapCircle(data);
      setCircles((prev) => prev
        .map((circle) => (circle.id === id ? next : circle))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el círculo');
      setStatus('error');
    }
  }, [user]);

  const deleteCircle = useCallback(async (id: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const { error: deleteError } = await RelationshipsService.table('circles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setCircles((prev) => prev.filter((circle) => circle.id !== id));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el círculo');
      setStatus('error');
    }
  }, [user]);

  const addRelationship = useCallback(async (input: RelationshipCreateInput) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const { data, error: insertError } = await RelationshipsService.table('relationships')
        .insert({
          user_id: user.id,
          circle_id: input.circleId,
          full_name: input.fullName.trim(),
          nickname: input.nickname?.trim() || null,
          category: input.category,
          birthday_date: input.birthdayDate || null,
          birthday_month: input.birthdayMonth || null,
          birthday_day: input.birthdayDay || null,
          last_contact_at: input.lastContactAt || null,
          next_contact_suggested_at: input.nextContactSuggestedAt || null,
          notes: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      setRelationships((prev) => [...prev, mapRelationship(data)].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la persona');
      setStatus('error');
    }
  }, [user]);

  const updateRelationship = useCallback(async (id: string, input: Partial<RelationshipCreateInput>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const updateData: any = { updated_at: new Date().toISOString() };

      if (input.circleId !== undefined) updateData.circle_id = input.circleId;
      if (input.fullName !== undefined) updateData.full_name = input.fullName.trim();
      if (input.nickname !== undefined) updateData.nickname = input.nickname?.trim() || null;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.birthdayDate !== undefined) updateData.birthday_date = input.birthdayDate || null;
      if (input.birthdayMonth !== undefined) updateData.birthday_month = input.birthdayMonth || null;
      if (input.birthdayDay !== undefined) updateData.birthday_day = input.birthdayDay || null;
      if (input.lastContactAt !== undefined) updateData.last_contact_at = input.lastContactAt || null;
      if (input.nextContactSuggestedAt !== undefined) updateData.next_contact_suggested_at = input.nextContactSuggestedAt || null;

      const { data, error: updateError } = await RelationshipsService.table('relationships')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      const next = mapRelationship(data);
      setRelationships((prev) => prev.map((item) => (item.id === id ? next : item)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la persona');
      setStatus('error');
    }
  }, [user]);

  const setRelationshipArchived = useCallback(async (relationshipId: string, archived: boolean) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const now = new Date().toISOString();

    try {
      const { data, error: updateError } = await RelationshipsService.table('relationships')
        .update({
          is_archived: archived,
          archived_at: archived ? now : null,
          updated_at: now
        })
        .eq('id', relationshipId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      if (archived) {
        const { error: archiveEventsError } = await RelationshipsService.table('events')
          .update({
            is_archived: true,
            archived_at: now,
            updated_at: now
          })
          .eq('relationship_id', relationshipId)
          .eq('user_id', user.id);

        if (archiveEventsError) throw archiveEventsError;

        setEvents((prev) => prev.map((event) => (
          event.relationshipId === relationshipId
            ? { ...event, isArchived: true, archivedAt: now, updatedAt: now }
            : event
        )));
      }

      const next = mapRelationship(data);
      setRelationships((prev) => prev.map((item) => (item.id === relationshipId ? next : item)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo archivar/desarchivar');
      setStatus('error');
    }
  }, [user]);

  const appendNote = useCallback(async (relationshipId: string, text: string) => {
    if (!user || !text.trim()) return;

    setStatus('saving');
    setError(null);

    try {
      const current = relationships.find((item) => item.id === relationshipId);
      if (!current) throw new Error('Persona no encontrada');

      const nextNotes: RelationshipNoteEntry[] = [
        ...(current.notes || []),
        {
          timestamp: new Date().toISOString(),
          text: text.trim()
        }
      ];

      const { data, error: updateError } = await RelationshipsService.table('relationships')
        .update({
          notes: nextNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', relationshipId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      const next = mapRelationship(data);
      setRelationships((prev) => prev.map((item) => (item.id === relationshipId ? next : item)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar la nota');
      setStatus('error');
    }
  }, [user, relationships]);

  const addEvent = useCallback(async (input: {
    relationshipId: string;
    title: string;
    eventType: RelationshipEventType;
    eventDate: string;
    startDate?: string;
    endDate?: string;
  }) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const { data, error: insertError } = await RelationshipsService.table('events')
        .insert({
          user_id: user.id,
          relationship_id: input.relationshipId,
          title: input.title.trim(),
          event_type: input.eventType,
          event_date: input.eventDate,
          start_date: input.startDate || null,
          end_date: input.endDate || null,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      setEvents((prev) => [mapEvent(data), ...prev]);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el evento');
      setStatus('error');
    }
  }, [user]);

  const setEventArchived = useCallback(async (eventId: string, archived: boolean) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const now = new Date().toISOString();

    try {
      const { data, error: updateError } = await RelationshipsService.table('events')
        .update({
          is_archived: archived,
          archived_at: archived ? now : null,
          updated_at: now
        })
        .eq('id', eventId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      const next = mapEvent(data);
      setEvents((prev) => prev.map((item) => (item.id === eventId ? next : item)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el evento');
      setStatus('error');
    }
  }, [user]);

  const getRelatedTasks = useCallback((relationshipId: string) => {
    const linkedTaskIds = taskLinks
      .filter((link) => link.relationshipId === relationshipId)
      .map((link) => link.taskId);

    return linkedTaskIds
      .map((taskId) => tasksById[taskId])
      .filter(Boolean)
      .sort((a, b) => {
        if (a.completed === b.completed) {
          return (b.updatedAt || '').localeCompare(a.updatedAt || '');
        }
        return a.completed ? 1 : -1;
      });
  }, [taskLinks, tasksById]);

  const getAvailablePrivateTasks = useCallback((relationshipId: string) => {
    const linkedTaskIds = new Set(
      taskLinks
        .filter((link) => link.relationshipId === relationshipId)
        .map((link) => link.taskId)
    );

    return Object.values(tasksById)
      .filter((task) => task.isPrivate && !linkedTaskIds.has(task.id))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [taskLinks, tasksById]);

  const refreshPrivateTasks = useCallback(async () => {
    if (!user) return;

    const { data, error: tasksError } = await RelationshipsService.table('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_private', true)
      .order('updated_at', { ascending: false })
      .limit(200);

    if (tasksError) {
      throw tasksError;
    }

    const map = (data || []).reduce((acc: Record<string, RelatedTask>, row: any) => {
      acc[row.id] = mapTask(row);
      return acc;
    }, {});

    setTasksById((prev) => ({ ...prev, ...map }));
  }, [user]);

  const linkExistingTask = useCallback(async (relationshipId: string, taskId: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const { data, error: insertError } = await RelationshipsService.table('relationship_tasks')
        .insert({
          user_id: user.id,
          relationship_id: relationshipId,
          task_id: taskId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      setTaskLinks((prev) => [...prev, mapTaskLink(data)]);
      await refreshPrivateTasks();
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo vincular la tarea');
      setStatus('error');
    }
  }, [user, refreshPrivateTasks]);

  const unlinkTask = useCallback(async (relationshipId: string, taskId: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const { error: deleteError } = await RelationshipsService.table('relationship_tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('relationship_id', relationshipId)
        .eq('task_id', taskId);

      if (deleteError) throw deleteError;

      setTaskLinks((prev) => prev.filter((link) => !(link.relationshipId === relationshipId && link.taskId === taskId)));
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desvincular la tarea');
      setStatus('error');
    }
  }, [user]);

  const createRelatedTask = useCallback(async (
    relationshipId: string,
    taskInput: RelationshipTaskCreateInput,
    privateDefault = true
  ) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const taskCode = await generateTaskCode(user.id);
      const now = new Date().toISOString();

      const { data: taskData, error: taskError } = await RelationshipsService.table('tasks')
        .insert({
          user_id: user.id,
          task_code: taskCode,
          title: taskInput.title.trim(),
          completed: false,
          category: taskInput.category || 'social',
          priority: 'delete',
          size: 'pequeña',
          progress: 0,
          is_private: taskInput.isPrivate ?? privateDefault,
          is_recurrent: false,
          created_at: now,
          updated_at: now
        })
        .select('*')
        .single();

      if (taskError) throw taskError;

      const newTask = mapTask(taskData);

      const { data: linkData, error: linkError } = await RelationshipsService.table('relationship_tasks')
        .insert({
          user_id: user.id,
          relationship_id: relationshipId,
          task_id: newTask.id,
          created_at: now,
          updated_at: now
        })
        .select('*')
        .single();

      if (linkError) throw linkError;

      setTasksById((prev) => ({ ...prev, [newTask.id]: newTask }));
      setTaskLinks((prev) => [...prev, mapTaskLink(linkData)]);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear/vincular la tarea');
      setStatus('error');
    }
  }, [user]);

  const relationshipsByCircle = useMemo(() => {
    return relationships.reduce((acc: Record<string, RelationshipPerson[]>, relationship) => {
      const key = relationship.circleId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(relationship);
      return acc;
    }, {});
  }, [relationships]);

  const getRelationshipById = useCallback((id: string) => {
    return relationships.find((relationship) => relationship.id === id);
  }, [relationships]);

  return {
    circles,
    relationships,
    relationshipsByCircle,
    events,
    taskLinks,
    tasksById,
    isLoaded,
    status,
    error,
    loadAll,
    addCircle,
    updateCircle,
    deleteCircle,
    addRelationship,
    updateRelationship,
    setRelationshipArchived,
    appendNote,
    addEvent,
    setEventArchived,
    getRelatedTasks,
    getAvailablePrivateTasks,
    linkExistingTask,
    unlinkTask,
    createRelatedTask,
    getRelationshipById
  };
};
