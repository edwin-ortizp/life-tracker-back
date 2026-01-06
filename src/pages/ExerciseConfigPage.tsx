// src/pages/ExerciseConfigPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dumbbell, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useModuleSettings } from '@/hooks/useModuleSettings';
import { useNavigate } from 'react-router-dom';
import { exerciseViews } from '@/features/exercise/views';

interface ExerciseType {
  id: string;
  user_id: string;
  name: string;
  calories_per_hour: number;
  steps_equivalent: number;
  category: string;
  created_at: string;
}

const ExerciseConfigPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    calories_per_hour: 0,
    steps_equivalent: 0,
    category: ''
  });

  const exerciseDefaults = { dailyCalories: 500 };
  const { settings, saveSettings, status: settingsStatus, error: settingsError } = useModuleSettings(
    'exercise',
    exerciseDefaults
  );
  const [caloriesInput, setCaloriesInput] = useState(settings.dailyCalories);

  useEffect(() => {
    setCaloriesInput(settings.dailyCalories);
  }, [settings.dailyCalories]);

  useEffect(() => {
    if (user) {
      loadExerciseTypes();
    }
  }, [user]);

  const loadExerciseTypes = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('exercise_types')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error loading exercise types:', error);
      toast.error('Error al cargar tipos de ejercicio');
    } else {
      setExerciseTypes(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      ...formData,
      user_id: user.id
    };

    if (editingId) {
      const { error } = await supabase
        .from('exercise_types')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating:', error);
        toast.error('Error al actualizar');
      } else {
        toast.success('Tipo de ejercicio actualizado');
        resetForm();
        loadExerciseTypes();
      }
    } else {
      const { error } = await supabase
        .from('exercise_types')
        .insert(payload);

      if (error) {
        console.error('Error creating:', error);
        toast.error('Error al crear');
      } else {
        toast.success('Tipo de ejercicio creado');
        resetForm();
        loadExerciseTypes();
      }
    }
  };

  const handleEdit = (item: ExerciseType) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      calories_per_hour: item.calories_per_hour,
      steps_equivalent: item.steps_equivalent,
      category: item.category
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Estas seguro de eliminar este tipo de ejercicio?')) return;

    const { error } = await supabase
      .from('exercise_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar');
    } else {
      toast.success('Tipo de ejercicio eliminado');
      loadExerciseTypes();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      calories_per_hour: 0,
      steps_equivalent: 0,
      category: ''
    });
  };

  if (!user) {
    return (
      <ModuleViewLayout
        title="Configuracion de Ejercicio"
        icon={<Dumbbell className="h-4 w-4 text-white" />}
      >
        <div className="p-4">
          <Card>
            <CardContent className="p-6">Inicia sesion para configurar ejercicios</CardContent>
          </Card>
        </div>
      </ModuleViewLayout>
    );
  }

  return (
    <ModuleViewLayout
      title="Configuracion de Ejercicio"
      subtitle="Administra objetivos y tipos de ejercicio"
      icon={<Dumbbell className="h-4 w-4 text-white" />}
      views={exerciseViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/exercise/view/${key}`)}
    >
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Objetivo diario de calorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dailyCalories">Calorias diarias objetivo</Label>
              <Input
                id="dailyCalories"
                type="number"
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => saveSettings({ dailyCalories: caloriesInput })}>
                Guardar
              </Button>
              {settingsStatus === 'saving' && (
                <span className="text-xs text-gray-500">Guardando...</span>
              )}
              {settingsStatus === 'saved' && (
                <span className="text-xs text-green-600">Guardado</span>
              )}
              {settingsError && (
                <span className="text-xs text-red-600">{settingsError}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Editar' : 'Nuevo'} Tipo de Ejercicio</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="calories">Calorias por hora</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={formData.calories_per_hour}
                    onChange={(e) => setFormData({ ...formData, calories_per_hour: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="steps">Equivalente en pasos</Label>
                  <Input
                    id="steps"
                    type="number"
                    value={formData.steps_equivalent}
                    onChange={(e) => setFormData({ ...formData, steps_equivalent: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Cardio, Fuerza, etc."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Actualizar' : 'Agregar'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Ejercicio ({exerciseTypes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando...</p>
              ) : exerciseTypes.length === 0 ? (
                <p className="text-gray-500">No hay tipos de ejercicio configurados</p>
              ) : (
                <div className="space-y-2">
                  {exerciseTypes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.calories_per_hour} cal/h · {item.steps_equivalent} pasos
                          {item.category && ` · ${item.category}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleViewLayout>
  );
};

export default ExerciseConfigPage;
