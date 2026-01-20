import { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Target,
  ListTodo,
  TrendingUp,
  Edit,
  Sparkles,
  Hash,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { AiSuggestionsModal } from './AiSuggestionsModal';
import type { Goal } from '../types';

interface Props {
  goal: Goal;
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string | undefined, index: number) => void;
  onEditTask: (taskId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddEntry: (text: string, date: string, isMilestone: boolean) => void;
  onIncrementPositive: () => void;
  onIncrementNegative: () => void;
  onAddNumericEntry: (value: number, note?: string, date?: string) => void;
  onEdit: () => void;
}

export const GoalDetail = ({ 
  goal, 
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddEntry,
  onIncrementPositive,
  onIncrementNegative,
  onAddNumericEntry,
  onEdit
}: Props) => {
  // Función para calcular el progreso numérico correctamente
  const calculateNumericProgress = (currentValue: number, targetValue: number) => {
    if (currentValue === targetValue) return 100;
    
    // Determinar si es una meta de aumento o disminución basándose en si el objetivo es mayor que cero
    // Para metas de disminución (como bajar peso), el progreso se calcula diferente
    const isDecreasing = currentValue > targetValue;
    
    if (isDecreasing) {
      // Meta de disminución: mientras más bajo el valor actual, mayor el progreso
      const progress = targetValue === 0 ? 0 : ((currentValue - targetValue) / currentValue) * 100;
      return Math.max(0, Math.min(100, 100 - progress));
    } else {
      // Meta de aumento: progreso normal
      const progress = targetValue === 0 ? 0 : (currentValue / targetValue) * 100;
      return Math.max(0, Math.min(100, progress));
    }
  };
  const [taskTitle, setTaskTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [milestone, setMilestone] = useState(false);
  const [numericValue, setNumericValue] = useState('');
  const [numericNote, setNumericNote] = useState('');
  const [numericDate, setNumericDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  const completed = goal.tasks.filter(t => t.done).length;
  const total = goal.tasks.length;
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'abandoned':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'active':
        return <Clock className="h-4 w-4" />;
      case 'abandoned':
        return <Target className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'active':
        return 'Activo';
      case 'abandoned':
        return 'Abandonado';
      default:
        return status;
    }
  };

  const handleAddTask = () => {
    if (taskTitle.trim()) {
      onAddTask(taskTitle.trim());
      setTaskTitle('');
    }
  };

  const startEditingTask = (taskId: string, title: string) => {
    setEditingTaskId(taskId);
    setEditingTaskTitle(title);
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const saveEditingTask = () => {
    if (!editingTaskId) return;
    const nextTitle = editingTaskTitle.trim();
    if (!nextTitle) return;
    onEditTask(editingTaskId, nextTitle);
    cancelEditingTask();
  };

  const handleAddEntry = () => {
    if (entryText.trim()) {
      onAddEntry(entryText.trim(), entryDate, milestone);
      setEntryText('');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setMilestone(false);
    }
  };

  const handleAddNumericEntry = () => {
    const value = parseFloat(numericValue);
    if (!isNaN(value) && value >= 0) {
      onAddNumericEntry(value, numericNote.trim() || undefined, numericDate);
      setNumericValue('');
      setNumericNote('');
      setNumericDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Goal Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{goal.title}</CardTitle>
                {goal.description && (
                  <CardDescription className="mt-2">
                    {goal.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(goal.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(goal.status)}
                    <span>{getStatusText(goal.status)}</span>
                  </div>
                </Badge>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Tareas
                </CardTitle>
                <CardDescription>
                  {completed} de {total} tareas completadas
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAiModalOpen(true)}
                className="bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
              >
                <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                <span className="text-purple-700">Ideas con IA</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-gray-600 text-center">
                {Math.round(progressPercentage)}% completado
              </p>
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
              {goal.tasks.length > 0 ? (
                goal.tasks.map((task, idx) => {
                  const isEditing = editingTaskId === task.id;
                  return (
                    <div key={task.id || idx} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                      <Checkbox
                        id={`task-${idx}`}
                        checked={task.done}
                        onCheckedChange={() => onToggleTask(task.id, idx)}
                        disabled={isEditing}
                      />
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editingTaskTitle}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditingTask();
                              if (e.key === 'Escape') cancelEditingTask();
                            }}
                            className="h-8"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={saveEditingTask}
                            disabled={!editingTaskTitle.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEditingTask}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Label
                            htmlFor={`task-${idx}`}
                            className={`flex-1 cursor-pointer ${
                              task.done ? 'line-through text-gray-500' : ''
                            }`}
                          >
                            {task.title}
                          </Label>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => task.id && startEditingTask(task.id, task.title)}
                            disabled={!task.id}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={!task.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta accion no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => task.id && onDeleteTask(task.id)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {task.done && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay tareas aún. Agrega la primera tarea para empezar.
                </p>
              )}
            </div>

            <Separator />

            {/* Add Task */}
            <div className="space-y-2">
              <Label htmlFor="new-task">Nueva tarea</Label>
              <div className="flex gap-2">
                <Input
                  id="new-task"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Escribe una nueva tarea..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask} disabled={!taskTitle.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Numeric Progress */}
        {goal.numericGoal?.enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Meta Numérica
              </CardTitle>
              <CardDescription>
                Progreso hacia {goal.numericGoal.targetValue.toLocaleString()} {goal.numericGoal.unit}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Numeric Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progreso</span>
                  <span className="font-medium">
                    {goal.numericGoal.currentValue.toLocaleString()} / {goal.numericGoal.targetValue.toLocaleString()} {goal.numericGoal.unit}
                  </span>
                </div>
                <Progress 
                  value={calculateNumericProgress(
                    goal.numericGoal.currentValue,
                    goal.numericGoal.targetValue
                  )} 
                  className="h-3" 
                />
                <p className="text-sm text-gray-600 text-center">
                  {Math.round(calculateNumericProgress(
                    goal.numericGoal.currentValue,
                    goal.numericGoal.targetValue
                  ))}% completado
                </p>
              </div>

              {/* Numeric History */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Historial de valores</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {goal.numericEntries && goal.numericEntries.length > 0 ? (
                    goal.numericEntries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.value.toLocaleString()} {goal.numericGoal!.unit}</span>
                            {entry.note && (
                              <span className="text-xs text-gray-500">- {entry.note}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay registros numéricos aún
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Add Numeric Entry */}
              <div className="space-y-3">
                <Label htmlFor="numeric-value">Actualizar valor</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="numeric-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={numericValue}
                    onChange={(e) => setNumericValue(e.target.value)}
                    placeholder={`Valor en ${goal.numericGoal.unit}`}
                  />
                  <Input
                    type="date"
                    value={numericDate}
                    onChange={(e) => setNumericDate(e.target.value)}
                  />
                </div>
                <Input
                  value={numericNote}
                  onChange={(e) => setNumericNote(e.target.value)}
                  placeholder="Nota opcional..."
                />
                <Button 
                  onClick={handleAddNumericEntry} 
                  disabled={!numericValue || isNaN(parseFloat(numericValue))}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar valor
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Historial de Avances
            </CardTitle>
            <CardDescription>
              Registra tu progreso y logros importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Entries List */}
            <div className="space-y-3">
              {goal.entries.length > 0 ? (
                goal.entries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                      <div className="flex-shrink-0">
                        {entry.isMilestone ? (
                          <Star className="h-4 w-4 text-yellow-500 mt-1" />
                        ) : (
                          <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{entry.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                      {entry.isMilestone && (
                        <Badge variant="secondary" className="text-xs">
                          Hito
                        </Badge>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay avances registrados. Comparte tu progreso aquí.
                </p>
              )}
            </div>

            <Separator />

            {/* Add Entry */}
            <div className="space-y-3">
              <Label htmlFor="new-entry">Nuevo avance</Label>
              <Textarea
                id="new-entry"
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                placeholder="Describe tu progreso..."
                className="min-h-[60px]"
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="entry-date" className="text-sm">Fecha:</Label>
                  <Input
                    id="entry-date"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="milestone"
                    checked={milestone}
                    onCheckedChange={(checked) => setMilestone(checked as boolean)}
                  />
                  <Label htmlFor="milestone" className="text-sm">
                    Marcar como hito
                  </Label>
                </div>
              </div>
              <Button onClick={handleAddEntry} disabled={!entryText.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar avance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Goal Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dates */}
            {(goal.startDate || goal.dueDate) && (
              <div className="space-y-2">
                {goal.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Inicio:</span>
                    <span>{new Date(goal.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {goal.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Límite:</span>
                    <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Progress Metrics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <ListTodo className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Tareas:</span>
                <span>{completed}/{total}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Avances:</span>
                <span>{goal.entries.length}</span>
              </div>
              {goal.numericGoal?.enabled && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Progreso:</span>
                  <span>
                    {Math.round(calculateNumericProgress(
                      goal.numericGoal.currentValue,
                      goal.numericGoal.targetValue
                    ))}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Motivation Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Motivación</CardTitle>
            <CardDescription>
              Registra tu estado de ánimo hacia este objetivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onIncrementPositive}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                <span>{goal.positiveCount || 0}</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onIncrementNegative}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                <span>{goal.negativeCount || 0}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions Modal */}
      <AiSuggestionsModal
        goal={goal}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
