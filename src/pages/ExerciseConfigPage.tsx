// src/pages/ExerciseConfigPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    calories_per_hour: 0,
    steps_equivalent: 0,
    category: ''
  });

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
      // Update
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
      // Create
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
    if (!confirm('¿Estás seguro de eliminar este tipo de ejercicio?')) return;

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
    return <div>Inicia sesión para configurar ejercicios</div>;
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración de Ejercicios</h1>
        <p className="text-gray-500">Administra los tipos de ejercicio disponibles</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Form */}
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
                <Label htmlFor="calories">Calorías por hora</Label>
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
                <Label htmlFor="category">Categoría</Label>
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

        {/* List */}
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
    </PageLayout>
  );
};

export default ExerciseConfigPage;
