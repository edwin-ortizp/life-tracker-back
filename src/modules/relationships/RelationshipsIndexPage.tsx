import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, Plus, Users } from 'lucide-react';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { ModuleViewAction } from '@/shared/components/module-views/types';
import { paths } from '@/core/routes/paths';
import { useRelationshipsData } from '@/modules/relationships/controllers/useRelationshipsData.supabase';
import {
  RELATIONSHIP_CATEGORIES,
  RELATIONSHIP_CATEGORY_LABELS,
  type RelationshipCategory
} from '@/modules/relationships/models';
import {
  CircleSection,
  CirclesSidebar,
  useEffectiveCircle
} from '@/modules/relationships/components';

const RelationshipsIndexPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    circles,
    relationships,
    relationshipsByCircle,
    events,
    status,
    error,
    addCircle,
    updateCircle,
    deleteCircle,
    addRelationship
  } = useRelationshipsData();

  const circleFromQuery = searchParams.get('circle');
  const archivedFromQuery = searchParams.get('archived') === '1';
  const hasNotFoundAlert = searchParams.get('notFound') === '1';

  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(circleFromQuery);
  const [showArchived, setShowArchived] = useState(archivedFromQuery);
  const [searchQuery, setSearchQuery] = useState('');

  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isCircleDialogOpen, setIsCircleDialogOpen] = useState(false);

  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleSortOrder, setNewCircleSortOrder] = useState(0);
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [newCircleFrequency, setNewCircleFrequency] = useState('');

  const [newContactCircleId, setNewContactCircleId] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactNickname, setNewContactNickname] = useState('');
  const [newContactCategory, setNewContactCategory] = useState<RelationshipCategory>(RELATIONSHIP_CATEGORIES.SOCIAL);
  const [newContactBirthdayDate, setNewContactBirthdayDate] = useState('');
  const [newContactBirthdayMonth, setNewContactBirthdayMonth] = useState('');
  const [newContactBirthdayDay, setNewContactBirthdayDay] = useState('');

  const { effectiveSelectedCircleId } = useEffectiveCircle(
    circles,
    relationshipsByCircle,
    selectedCircleId,
    showArchived
  );

  const syncQuery = useCallback((next: { circle?: string | null; archived?: boolean; removeNotFound?: boolean }) => {
    const params = new URLSearchParams(searchParams);

    const nextCircle = next.circle !== undefined ? next.circle : effectiveSelectedCircleId;
    const nextArchived = next.archived !== undefined ? next.archived : showArchived;

    if (nextCircle) params.set('circle', nextCircle);
    else params.delete('circle');

    params.set('archived', nextArchived ? '1' : '0');

    if (next.removeNotFound) params.delete('notFound');

    setSearchParams(params, { replace: true });
  }, [searchParams, effectiveSelectedCircleId, showArchived, setSearchParams]);

  useEffect(() => {
    if (hasNotFoundAlert) {
      syncQuery({ removeNotFound: true });
    }
  }, [hasNotFoundAlert, syncQuery]);

  const visibleRelationships = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return relationships.filter((person) => {
      if (!showArchived && person.isArchived) return false;
      if (!normalizedQuery) return true;

      return (
        person.fullName.toLowerCase().includes(normalizedQuery) ||
        (person.nickname || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [relationships, showArchived, searchQuery]);

  const visibleByCircle = useMemo(() => {
    return visibleRelationships.reduce((acc: Record<string, typeof visibleRelationships>, person) => {
      if (!acc[person.circleId]) acc[person.circleId] = [];
      acc[person.circleId].push(person);
      return acc;
    }, {} as Record<string, typeof visibleRelationships>);
  }, [visibleRelationships]);

  const visibleCountByCircle = useMemo(() => {
    return circles.reduce((acc: Record<string, number>, circle) => {
      acc[circle.id] = visibleByCircle[circle.id]?.length || 0;
      return acc;
    }, {});
  }, [circles, visibleByCircle]);

  const eventsByRelationship = useMemo(() => {
    return events.reduce((acc: Record<string, typeof events>, event) => {
      if (!acc[event.relationshipId]) acc[event.relationshipId] = [];
      acc[event.relationshipId].push(event);
      return acc;
    }, {} as Record<string, typeof events>);
  }, [events]);

  const circlesToRender = useMemo(() => {
    if (effectiveSelectedCircleId) {
      const selected = circles.find((circle) => circle.id === effectiveSelectedCircleId);
      return selected ? [selected] : [];
    }

    return circles.filter((circle) => (visibleByCircle[circle.id]?.length || 0) > 0);
  }, [circles, effectiveSelectedCircleId, visibleByCircle]);

  const onSelectCircle = (circleId: string) => {
    setSelectedCircleId(circleId);
    syncQuery({ circle: circleId });
  };

  const onToggleArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    syncQuery({ archived: next });
  };

  const onCreateCircle = async () => {
    if (!newCircleName.trim()) return;

    await addCircle({
      name: newCircleName,
      sortOrder: Number.isNaN(newCircleSortOrder) ? 0 : newCircleSortOrder,
      contactFrequencyDays: newCircleFrequency ? Number(newCircleFrequency) : undefined,
      description: newCircleDescription || undefined
    });

    setNewCircleName('');
    setNewCircleSortOrder(0);
    setNewCircleDescription('');
    setNewCircleFrequency('');
    setIsCircleDialogOpen(false);
  };

  const onEditCircle = async (circleId: string) => {
    const current = circles.find((circle) => circle.id === circleId);
    if (!current) return;

    const nextName = window.prompt('Nuevo nombre del círculo', current.name);
    if (!nextName || !nextName.trim()) return;

    const nextSortRaw = window.prompt('Nuevo orden', String(current.sortOrder));
    const nextSort = Number(nextSortRaw);

    const nextFrequencyRaw = window.prompt(
      'Frecuencia de contacto en días (vacío para sin regla)',
      current.contactFrequencyDays ? String(current.contactFrequencyDays) : ''
    );
    const parsedFrequency = nextFrequencyRaw ? Number(nextFrequencyRaw) : undefined;
    const nextFrequency = parsedFrequency !== undefined && Number.isFinite(parsedFrequency)
      ? parsedFrequency
      : undefined;

    await updateCircle(circleId, {
      name: nextName.trim(),
      sortOrder: Number.isFinite(nextSort) ? nextSort : current.sortOrder,
      contactFrequencyDays: nextFrequency
    });
  };

  const onDeleteCircle = async (circleId: string) => {
    const confirmed = window.confirm('¿Eliminar este círculo? Solo funciona si no tiene personas asociadas.');
    if (!confirmed) return;
    await deleteCircle(circleId);
  };

  const onCreateContact = async () => {
    const resolvedCircleId = newContactCircleId || effectiveSelectedCircleId;
    if (!resolvedCircleId || !newContactName.trim()) return;

    await addRelationship({
      circleId: resolvedCircleId,
      fullName: newContactName,
      nickname: newContactNickname || undefined,
      category: newContactCategory,
      birthdayDate: newContactBirthdayDate || undefined,
      birthdayMonth: newContactBirthdayMonth ? Number(newContactBirthdayMonth) : undefined,
      birthdayDay: newContactBirthdayDay ? Number(newContactBirthdayDay) : undefined
    });

    setNewContactCircleId('');
    setNewContactName('');
    setNewContactNickname('');
    setNewContactCategory(RELATIONSHIP_CATEGORIES.SOCIAL);
    setNewContactBirthdayDate('');
    setNewContactBirthdayMonth('');
    setNewContactBirthdayDay('');
    setIsContactDialogOpen(false);
  };

  const onOpenPerson = (personId: string) => {
    const params = new URLSearchParams();
    if (effectiveSelectedCircleId) params.set('circle', effectiveSelectedCircleId);
    params.set('archived', showArchived ? '1' : '0');
    navigate(`${paths.relationships.detail(personId)}?${params.toString()}`);
  };

  const actions: ModuleViewAction[] = [
    {
      id: 'toggle-archived',
      label: showArchived ? 'Ocultar archivados' : 'Mostrar archivados',
      icon: showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
      onClick: onToggleArchived,
      showLabel: true
    },
    {
      id: 'new-circle',
      label: 'Nuevo círculo',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => setIsCircleDialogOpen(true),
      showLabel: true
    },
    {
      id: 'new-contact',
      label: 'Nuevo',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => setIsContactDialogOpen(true),
      showLabel: true,
      className: 'bg-black text-white hover:bg-gray-800'
    }
  ];

  return (
    <ModuleViewLayout
      title="Relaciones"
      subtitle="CRM personal"
      icon={<Users className="h-4 w-4 text-white" />}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        {hasNotFoundAlert && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-3 text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Contacto no encontrado o sin acceso.</span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-3 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <Card className="border-slate-200">
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">Estado: {status}</div>
            <div className="relative min-w-64">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o apodo"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <CirclesSidebar
            circles={circles}
            selectedCircleId={effectiveSelectedCircleId}
            counts={visibleCountByCircle}
            onSelectCircle={onSelectCircle}
            onAddCircle={() => setIsCircleDialogOpen(true)}
            onEditCircle={(circle) => onEditCircle(circle.id)}
            onDeleteCircle={(circle) => onDeleteCircle(circle.id)}
          />

          <div className="space-y-4">
            {circlesToRender.length === 0 && (
              <Card>
                <CardContent className="p-6 text-sm text-slate-600">
                  No hay contactos para los filtros actuales.
                </CardContent>
              </Card>
            )}

            {circlesToRender.map((circle) => (
              <CircleSection
                key={circle.id}
                circle={circle}
                people={visibleByCircle[circle.id] || []}
                eventsByRelationship={eventsByRelationship}
                onOpenPerson={onOpenPerson}
              />
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isCircleDialogOpen} onOpenChange={setIsCircleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo círculo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre" value={newCircleName} onChange={(e) => setNewCircleName(e.target.value)} />
            <Input
              type="number"
              placeholder="Orden"
              value={newCircleSortOrder}
              onChange={(e) => setNewCircleSortOrder(Number(e.target.value || 0))}
            />
            <Input
              type="number"
              min={1}
              placeholder="Frecuencia contacto (días)"
              value={newCircleFrequency}
              onChange={(e) => setNewCircleFrequency(e.target.value)}
            />
            <Input
              placeholder="Descripción (opcional)"
              value={newCircleDescription}
              onChange={(e) => setNewCircleDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCircleDialogOpen(false)}>Cancelar</Button>
              <Button onClick={onCreateCircle}>Crear círculo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              value={newContactCircleId || effectiveSelectedCircleId || ''}
              onChange={(e) => setNewContactCircleId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecciona círculo</option>
              {circles.map((circle) => (
                <option key={circle.id} value={circle.id}>{circle.name}</option>
              ))}
            </select>
            <Input placeholder="Nombre completo" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} />
            <Input placeholder="Apodo (opcional)" value={newContactNickname} onChange={(e) => setNewContactNickname(e.target.value)} />
            <select
              value={newContactCategory}
              onChange={(e) => setNewContactCategory(e.target.value as RelationshipCategory)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {Object.values(RELATIONSHIP_CATEGORIES).map((category) => (
                <option key={category} value={category}>{RELATIONSHIP_CATEGORY_LABELS[category]}</option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Mes"
                type="number"
                min={1}
                max={12}
                value={newContactBirthdayMonth}
                onChange={(e) => setNewContactBirthdayMonth(e.target.value)}
              />
              <Input
                placeholder="Día"
                type="number"
                min={1}
                max={31}
                value={newContactBirthdayDay}
                onChange={(e) => setNewContactBirthdayDay(e.target.value)}
              />
              <Input
                placeholder="Fecha completa"
                type="date"
                value={newContactBirthdayDate}
                onChange={(e) => setNewContactBirthdayDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>Cancelar</Button>
              <Button onClick={onCreateContact}>Crear contacto</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleViewLayout>
  );
};

export default RelationshipsIndexPage;
