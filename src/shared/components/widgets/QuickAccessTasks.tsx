import React from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTaskData } from '@/modules/task/controllers/useTaskData.supabase';
import { startOfDay, endOfDay } from 'date-fns';

interface QuickAccessTasksProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessTasks: React.FC<QuickAccessTasksProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { allTasks, status } = useTaskData();
  const loading = status === 'loading';

  const todayStart = startOfDay(date);
  const todayEnd = endOfDay(date);

  // Numerador (X): Tareas completadas hoy (basado en updatedAt)
  const tasksCompletedToday = allTasks.filter(task => {
    if (!task.completed || !task.updatedAt) return false;
    const updateDate = task.updatedAt;
    return updateDate >= todayStart && updateDate <= todayEnd;
  }).length;

  // Denominador (Y): Tareas activas y vencidas hasta hoy (basado en dueDate)
  const activeAndOverdueTasks = allTasks.filter(task => {
    if (task.completed || !task.startDate) return false;
    const dueDate = task.startDate;
    return dueDate <= todayEnd; // dueDate menor o igual a hoy
  }).length;

  // Campos adicionales para mostrar
  const pendingToday = allTasks.filter(task => {
    if (task.completed || !task.startDate) return false;
    const dueDate = task.startDate;
    return dueDate >= todayStart && dueDate <= todayEnd; // tareas para hoy
  }).length;

  const overdueTasks = allTasks.filter(task => {
    if (task.completed || !task.startDate) return false;
    const dueDate = task.startDate;
    return dueDate < todayStart; // tareas vencidas (antes de hoy)
  }).length;

  const handleQuickAdd = () => {
    navigate('/task/view/list');
  };

  return (
    <DailyWidget
      title="Tareas"
      icon={ListTodo}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/task/view/list')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-purple-600">
              {tasksCompletedToday}/{activeAndOverdueTasks}
            </p>
            <p className="text-xs text-gray-500">
              {pendingToday} hoy
              {overdueTasks > 0 && (
                <span className="text-red-500 ml-1">
                  • {overdueTasks} vencidas
                </span>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickAdd();
            }}
            className="flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {variant === 'detailed' && 'Nueva'}
          </Button>
        </div>
        
        {variant === 'detailed' && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeAndOverdueTasks > 0 ? (tasksCompletedToday / activeAndOverdueTasks) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {activeAndOverdueTasks > 0 ? 
                `${((tasksCompletedToday / activeAndOverdueTasks) * 100).toFixed(0)}% progreso diario` :
                'Sin tareas pendientes'
              }
            </p>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessTasks;
