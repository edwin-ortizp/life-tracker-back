import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Target, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGoals } from '../hooks/useGoals';
import { GoalList } from './GoalList';
import { GoalDetail } from './GoalDetail';
import { GoalModal } from './GoalModal';
import type { Goal } from '../types';

export const Goals = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const {
    goals,
    status,
    error,
    addGoal,
    updateGoal,
    addTask,
    toggleTask,
    addEntry,
    incrementPositiveCount,
    incrementNegativeCount,
    addNumericEntry
  } = useGoals();
  
  const [selectedId, setSelectedId] = useState<string | null>(goalId || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedGoal = goals.find(g => g.id === selectedId) || null;

  // Sync selectedId with URL parameter
  useEffect(() => {
    if (goalId && goalId !== selectedId) {
      setSelectedId(goalId);
    }
  }, [goalId, selectedId]);

  // Handle case when goalId doesn't exist
  useEffect(() => {
    if (goalId && goals.length > 0 && !goals.find(g => g.id === goalId)) {
      // Goal doesn't exist, redirect to goals list
      navigate('/goals');
    }
  }, [goalId, goals, navigate]);

  // Filter goals based on search and status
  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateGoal = async (goalData: Partial<Goal>) => {
    await addGoal({
      title: goalData.title || '',
      description: goalData.description,
      status: goalData.status || 'active',
      startDate: goalData.startDate,
      dueDate: goalData.dueDate,
      tasks: [],
      entries: []
    });
  };

  const handleUpdateGoal = async (goalData: Partial<Goal>) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(undefined);
  };

  const handleBackToList = () => {
    setSelectedId(null);
    navigate('/goals');
  };

  const handleSelectGoal = (id: string) => {
    setSelectedId(id);
    navigate(`/goals/${id}`);
  };

  if (selectedGoal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a objetivos
          </Button>
        </div>
        
        <GoalDetail
          goal={selectedGoal}
          onAddTask={title => addTask(selectedGoal.id, title)}
          onToggleTask={idx => toggleTask(selectedGoal.id, idx)}
          onAddEntry={(text, date, milestone) => addEntry(selectedGoal.id, { text, date, isMilestone: milestone })}
          onIncrementPositive={() => incrementPositiveCount(selectedGoal.id)}
          onIncrementNegative={() => incrementNegativeCount(selectedGoal.id)}
          onAddNumericEntry={(value, note, date) => addNumericEntry(selectedGoal.id, { value, note, date })}
          onEdit={() => handleEditGoal(selectedGoal)}
        />

        {/* Goal Modal - También disponible en vista de detalle */}
        <GoalModal
          goal={editingGoal}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={editingGoal ? handleUpdateGoal : handleCreateGoal}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos
                </CardTitle>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo objetivo
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar objetivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 sm:w-48">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="abandoned">Abandonados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals List */}
        <div>
          {status === 'loading' && (
            <Card className="p-6 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Cargando objetivos...</span>
              </div>
            </Card>
          )}
          
          {error && (
            <Card className="p-6 text-center">
              <div className="text-red-600">
                <p className="font-medium">Error al cargar objetivos</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </Card>
          )}
          
          {status !== 'loading' && !error && (
            <GoalList 
              goals={filteredGoals} 
              onSelect={handleSelectGoal}
              onIncrementPositive={incrementPositiveCount}
              onIncrementNegative={incrementNegativeCount}
              onEdit={handleEditGoal}
            />
          )}
        </div>

        {/* Results info */}
        {searchTerm || statusFilter !== 'all' ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                {filteredGoals.length === 0 ? (
                  'No se encontraron objetivos que coincidan con los filtros'
                ) : (
                  `Mostrando ${filteredGoals.length} de ${goals.length} objetivos`
                )}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Goal Modal */}
      <GoalModal
        goal={editingGoal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingGoal ? handleUpdateGoal : handleCreateGoal}
      />
    </>
  );
};

export default Goals;
