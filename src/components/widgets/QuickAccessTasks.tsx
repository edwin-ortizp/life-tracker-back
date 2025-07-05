import React from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTaskData } from '@/features/task/hooks/useTaskData';
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
  const { tasks, status } = useTaskData();
  const loading = status === 'loading';

  const todayStart = startOfDay(date);
  const todayEnd = endOfDay(date);

  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = task.dueDate;
    return dueDate >= todayStart && dueDate <= todayEnd;
  });

  const completedToday = todayTasks.filter(task => task.completed).length;
  const totalToday = todayTasks.length;
  const pendingToday = totalToday - completedToday;

  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = task.dueDate;
    return dueDate < todayStart;
  }).length;

  const handleQuickAdd = () => {
    navigate('/task');
  };

  return (
    <DailyWidget
      title="Tareas"
      icon={ListTodo}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/task')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-purple-600">
              {completedToday}/{totalToday}
            </p>
            <p className="text-xs text-gray-500">
              {pendingToday} pendientes
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
                style={{ width: `${totalToday > 0 ? (completedToday / totalToday) * 100 : 0}%` }}
              />
            </div>
            {totalToday > 0 && (
              <p className="text-xs text-gray-600">
                {((completedToday / totalToday) * 100).toFixed(0)}% completado hoy
              </p>
            )}
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessTasks;