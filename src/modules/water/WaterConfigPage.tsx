// src/pages/WaterConfigPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { WaterService } from '@/modules/water/services';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Droplet, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { waterViews } from '@/modules/water/views';

interface DrinkType {
  id: string;
  user_id: string;
  name: string;
  hydration_factor: number;
  color: string;
  icon: string;
  category: string;
  created_at: string;
}

const WaterConfigPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drinkTypes, setDrinkTypes] = useState<DrinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hydration_factor: 1.0,
    color: '#3b82f6',
    icon: 'Droplet',
    category: 'water'
  });

  useEffect(() => {
    if (user) {
      loadDrinkTypes();
    }
  }, [user]);

  const loadDrinkTypes = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await WaterService.getDrinkTypes(user.id);

    if (error) {
      console.error('Error loading drink types:', error);
      toast.error('Error al cargar tipos de bebida');
    } else {
      setDrinkTypes(data || []);
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
      const { error } = await WaterService.updateDrinkType(editingId, {
        userId: payload.user_id,
        name: payload.name,
        hydrationFactor: payload.hydration_factor,
        color: payload.color,
        icon: payload.icon,
        category: payload.category
      });

      if (error) {
        console.error('Error updating:', error);
        toast.error('Error al actualizar');
      } else {
        toast.success('Tipo de bebida actualizado');
        resetForm();
        loadDrinkTypes();
      }
    } else {
      const { error } = await WaterService.createDrinkType({
        userId: payload.user_id,
        name: payload.name,
        hydrationFactor: payload.hydration_factor,
        color: payload.color,
        icon: payload.icon,
        category: payload.category
      });

      if (error) {
        console.error('Error creating:', error);
        toast.error('Error al crear');
      } else {
        toast.success('Tipo de bebida creado');
        resetForm();
        loadDrinkTypes();
      }
    }
  };

  const handleEdit = (item: DrinkType) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      hydration_factor: item.hydration_factor,
      color: item.color,
      icon: item.icon,
      category: item.category
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Estas seguro de eliminar este tipo de bebida?')) return;

    const { error } = await WaterService.deleteDrinkType(id);

    if (error) {
      console.error('Error deleting:', error);
      toast.error('Error al eliminar');
    } else {
      toast.success('Tipo de bebida eliminado');
      loadDrinkTypes();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      hydration_factor: 1.0,
      color: '#3b82f6',
      icon: 'Droplet',
      category: 'water'
    });
  };

  if (!user) {
    return (
      <ModuleViewLayout
        title="Configuracion de Bebidas"
        icon={<Droplet className="h-4 w-4 text-white" />}
      >
        <div className="p-4">Inicia sesion para configurar bebidas</div>
      </ModuleViewLayout>
    );
  }

  return (
    <ModuleViewLayout
      title="Configuracion de Bebidas"
      subtitle="Administra los tipos de bebida disponibles"
      icon={<Droplet className="h-4 w-4 text-white" />}
      views={waterViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/water/view/${key}`)}
    >
      <div className="p-4">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Editar' : 'Nuevo'} Tipo de Bebida</CardTitle>
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
                  <Label htmlFor="hydration">Factor de hidratacion (0-1)</Label>
                  <Input
                    id="hydration"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.hydration_factor}
                    onChange={(e) => setFormData({ ...formData, hydration_factor: Number(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">1.0 = 100% hidratante (agua pura)</p>
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="water, coffee, juice, etc."
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
              <CardTitle>Tipos de Bebida ({drinkTypes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando...</p>
              ) : drinkTypes.length === 0 ? (
                <p className="text-gray-500">No hay tipos de bebida configurados</p>
              ) : (
                <div className="space-y-2">
                  {drinkTypes.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Hidratacion: {(item.hydration_factor * 100).toFixed(0)}%
                            {item.category && ` · ${item.category}`}
                          </p>
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

export default WaterConfigPage;
