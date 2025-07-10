import { Flag, Calendar, CheckCircle, Clock, Target, ThumbsUp, ThumbsDown, Eye, Edit } from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { Goal } from '../types';

interface Props {
  goals: Goal[];
  onSelect: (id: string) => void;
  onIncrementPositive: (id: string) => void;
  onIncrementNegative: (id: string) => void;
  onEdit: (goal: Goal) => void;
}

export const GoalList = ({ goals, onSelect, onIncrementPositive, onIncrementNegative, onEdit }: Props) => {
  if (goals.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <Target className="h-12 w-12 text-gray-400" />
          <div>
            <CardTitle className="text-lg text-gray-600">No hay objetivos</CardTitle>
            <CardDescription className="mt-2">
              Comienza creando tu primer objetivo para alcanzar tus metas
            </CardDescription>
          </div>
        </div>
      </Card>
    );
  }

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
        return <CheckCircle className="h-3 w-3" />;
      case 'active':
        return <Clock className="h-3 w-3" />;
      case 'abandoned':
        return <Flag className="h-3 w-3" />;
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

  return (
    <Card>
      <CardContent className="p-0">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
          <div className="col-span-4">Objetivo</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-2 text-center">Progreso</div>
          <div className="col-span-2 text-center">Fecha Límite</div>
          <div className="col-span-2 text-center">Acciones</div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-gray-100">
          {goals.map((goal, index) => {
            const completed = goal.tasks.filter(t => t.done).length;
            const total = goal.tasks.length;
            const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
            const hasNumericGoal = goal.numericGoal?.enabled;
            const numericProgress = hasNumericGoal 
              ? calculateNumericProgress(
                  goal.numericGoal!.currentValue, 
                  goal.numericGoal!.targetValue
                )
              : 0;
            const progressValue = hasNumericGoal ? numericProgress : progressPercentage;

            return (
              <div
                key={goal.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
                onClick={() => onSelect(goal.id)}
              >
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(goal.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(goal.status)} className="text-xs">
                      <span>{getStatusText(goal.status)}</span>
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {hasNumericGoal ? 'Meta' : 'Tareas'}
                      </span>
                      <span className="font-medium">
                        {hasNumericGoal ? (
                          `${Math.round(numericProgress)}%`
                        ) : (
                          `${completed}/${total}`
                        )}
                      </span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{total} tareas</span>
                      {goal.entries.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{goal.entries.length} avances</span>
                        </>
                      )}
                      {goal.dueDate && (
                        <>
                          <span>•</span>
                          <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onIncrementPositive(goal.id);
                        }}
                        className="h-6 w-6 p-0 text-green-600"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-green-600">{goal.positiveCount || 0}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onIncrementNegative(goal.id);
                        }}
                        className="h-6 w-6 p-0 text-red-600"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-red-600">{goal.negativeCount || 0}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(goal);
                        }}
                        className="h-6 w-6 p-0 text-blue-600 ml-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-12 gap-4">
                {/* Objetivo Column */}
                <div className="col-span-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(goal.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>{total} tareas</span>
                          {goal.entries.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{goal.entries.length} avances</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estado Column */}
                <div className="col-span-2 flex justify-center">
                  <Badge variant={getStatusVariant(goal.status)} className="text-xs">
                    <span>{getStatusText(goal.status)}</span>
                  </Badge>
                </div>

                {/* Progreso Column */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {hasNumericGoal ? 'Meta' : 'Tareas'}
                      </span>
                      <span className="font-medium">
                        {hasNumericGoal ? (
                          `${Math.round(numericProgress)}%`
                        ) : (
                          `${completed}/${total}`
                        )}
                      </span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                </div>

                {/* Fecha Límite Column */}
                <div className="col-span-2 flex justify-center items-center">
                  {goal.dueDate ? (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Sin fecha</span>
                  )}
                </div>

                {/* Acciones Column */}
                <div className="col-span-2 flex justify-center items-center gap-1">
                  {/* Vote buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrementPositive(goal.id);
                    }}
                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Voto positivo"
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-green-600 min-w-[1rem] text-center">
                    {goal.positiveCount || 0}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncrementNegative(goal.id);
                    }}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Voto negativo"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-red-600 min-w-[1rem] text-center">
                    {goal.negativeCount || 0}
                  </span>

                  {/* Edit button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(goal);
                    }}
                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
                    title="Editar objetivo"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>

                  {/* View button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(goal.id);
                    }}
                    className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                    title="Ver detalles"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
