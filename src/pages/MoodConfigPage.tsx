// src/pages/MoodConfigPage.tsx
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

interface MoodState {
  id: string;
  user_id: string;
  emoji: string;
  text: string;
  value: number;
  category: string;
  created_at: string;
}

const MoodConfigPage: React.FC = () => {
  const { user } = useAuth();
  const [moodStates, setMoodStates] = useState<MoodState[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    emoji: '',
    text: '',
    value: 5,
    category: ''
  });

  useEffect(() => {
    if (user) {
      loadMoodStates();
    }
  }, [user]);

  const loadMoodStates = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('mood_states')
      .select('*')
      .eq('user_id', user.id)
      .order('value', { ascending: false });

    if (error) {
      console.error('Error loading mood states:', error);
      toast.error('Error al cargar estados de ánimo');
    } else {
      setMoodStates(data || []);
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
        .from('mood_states')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating:', error);
        toast.error('Error al actualizar');
      } else {
        toast.success('Estado de ánimo actualizado');
        resetForm();
        loadMoodStates();
      }
    } else {
      const { error } = await supabase
        .from('mood_states')
        .insert(payload);

      if (error) {
        console.error('Error creating:', error);
        toast.error('Error al crear');
      } else {
        toast.success('Estado de ánimo creado');
        resetForm();
        loadMoodStates();
      }
    }
  };

  const handleEdit = (item: MoodState) => {
    setEditingId(item.id);
    setFormData({
      emoji: item.emoji,
      text: item.text,
      value: item.value,
      category: item.category
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este estado de ánimo?')) return;

    const { error } = await supabase
      .from('mood_states')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar');
    } else {
      toast.success('Estado de ánimo eliminado');
      loadMoodStates();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      emoji: '',
      text: '',
      value: 5,
      category: ''
    });
  };

  const getCategoryBadge = (value: number) => {
    if (value >= 8) return { label: 'Muy positivo', color: 'bg-green-100 text-green-800' };
    if (value >= 6) return { label: 'Positivo', color: 'bg-blue-100 text-blue-800' };
    if (value >= 4) return { label: 'Neutral', color: 'bg-gray-100 text-gray-800' };
    if (value >= 2) return { label: 'Negativo', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Muy negativo', color: 'bg-red-100 text-red-800' };
  };

  if (!user) {
    return <div>Inicia sesión para configurar estados de ánimo</div>;
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración de Estados de Ánimo</h1>
        <p className="text-gray-500">Administra los estados de ánimo disponibles</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar' : 'Nuevo'} Estado de Ánimo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="emoji">Emoji</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="😊"
                  required
                  maxLength={2}
                />
                <p className="text-xs text-gray-500 mt-1">Copia y pega un emoji</p>
              </div>
              <div>
                <Label htmlFor="text">Texto</Label>
                <Input
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Feliz, Triste, Ansioso..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="value">Valor (1-10)</Label>
                <Input
                  id="value"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">10 = Muy positivo, 1 = Muy negativo</p>
              </div>
              <div>
                <Label htmlFor="category">Categoría (opcional)</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Emocional, Físico, Mental..."
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
            <CardTitle>Estados de Ánimo ({moodStates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando...</p>
            ) : moodStates.length === 0 ? (
              <p className="text-gray-500">No hay estados de ánimo configurados</p>
            ) : (
              <div className="space-y-2">
                {moodStates.map((item) => {
                  const badge = getCategoryBadge(item.value);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <p className="font-medium">{item.text}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Valor: {item.value}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${badge.color}`}>
                              {badge.label}
                            </span>
                            {item.category && <span>· {item.category}</span>}
                          </div>
                        </div>
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default MoodConfigPage;
