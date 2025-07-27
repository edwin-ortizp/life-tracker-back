import React, { useState, useEffect } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { Goal, NumericGoal } from '../types';

interface Props {
  goal?: Goal;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<Goal>) => Promise<void>;
}

export const GoalModal = ({ goal, isOpen, onClose, onSave }: Props) => {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    status: goal?.status || 'active',
    startDate: goal?.startDate || '',
    dueDate: goal?.dueDate || '',
  });
  const [numericGoal, setNumericGoal] = useState<NumericGoal>({
    enabled: goal?.numericGoal?.enabled || false,
    targetValue: goal?.numericGoal?.targetValue || 0,
    currentValue: goal?.numericGoal?.currentValue || 0,
    unit: goal?.numericGoal?.unit || '',
    unitType: goal?.numericGoal?.unitType || 'quantity',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form data when goal prop changes
  useEffect(() => {
    setFormData({
      title: goal?.title || '',
      description: goal?.description || '',
      status: goal?.status || 'active',
      startDate: goal?.startDate || '',
      dueDate: goal?.dueDate || '',
    });
    setNumericGoal({
      enabled: goal?.numericGoal?.enabled || false,
      targetValue: goal?.numericGoal?.targetValue || 0,
      currentValue: goal?.numericGoal?.currentValue || 0,
      unit: goal?.numericGoal?.unit || '',
      unitType: goal?.numericGoal?.unitType || 'quantity',
    });
    setErrors({});
  }, [goal]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    
    if (formData.startDate && formData.dueDate) {
      const startDate = new Date(formData.startDate);
      const dueDate = new Date(formData.dueDate);
      if (startDate > dueDate) {
        newErrors.dueDate = 'La fecha límite debe ser posterior a la fecha de inicio';
      }
    }

    if (numericGoal.enabled) {
      if (numericGoal.targetValue <= 0) {
        newErrors.targetValue = 'El valor objetivo debe ser mayor a 0';
      }
      if (!numericGoal.unit.trim()) {
        newErrors.unit = 'La unidad es requerida para metas numéricas';
      }
      if (numericGoal.currentValue < 0) {
        newErrors.currentValue = 'El valor actual no puede ser negativo';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        description: formData.description.trim() || undefined,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        numericGoal: numericGoal.enabled ? numericGoal : undefined,
        numericEntries: goal?.numericEntries || [],
      });
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    const hasRequiredFields = formData.title.trim().length > 0;
    const hasValidNumericGoal = !numericGoal.enabled || 
      (numericGoal.targetValue > 0 && numericGoal.unit.trim().length > 0);
    
    return hasRequiredFields && hasValidNumericGoal && Object.keys(errors).length === 0;
  };

  const handleClose = () => {
    setFormData({
      title: goal?.title || '',
      description: goal?.description || '',
      status: goal?.status || 'active',
      startDate: goal?.startDate || '',
      dueDate: goal?.dueDate || '',
    });
    setNumericGoal({
      enabled: goal?.numericGoal?.enabled || false,
      targetValue: goal?.numericGoal?.targetValue || 0,
      currentValue: goal?.numericGoal?.currentValue || 0,
      unit: goal?.numericGoal?.unit || '',
      unitType: goal?.numericGoal?.unitType || 'quantity',
    });
    setErrors({});
    onClose();
  };

  const getUnitPlaceholder = (unitType: string) => {
    switch (unitType) {
      case 'currency':
        return 'Ej: COP, USD, EUR';
      case 'weight':
        return 'Ej: kg, lb, g';
      case 'quantity':
        return 'Ej: unidades, piezas';
      case 'percentage':
        return '%';
      case 'custom':
        return 'Ej: horas, días';
      default:
        return 'Unidad';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {goal ? 'Editar objetivo' : 'Crear nuevo objetivo'}
          </DialogTitle>
          <DialogDescription>
            {goal 
              ? 'Modifica los detalles de tu objetivo' 
              : 'Define un nuevo objetivo para alcanzar tus metas'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica - Full width */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  // Clear error when user starts typing
                  if (errors.title && e.target.value.trim()) {
                    setErrors({ ...errors, title: '' });
                  }
                }}
                placeholder="Ej. Aprender React avanzado"
                className={errors.title ? 'border-destructive' : ''}
                required
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe tu objetivo con más detalle..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Estado y Fechas - 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Goal['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="abandoned">Abandonado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha límite</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={errors.dueDate ? 'border-destructive' : ''}
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Numeric Goal Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="numericGoal"
                checked={numericGoal.enabled}
                onCheckedChange={(checked) => setNumericGoal({ ...numericGoal, enabled: checked as boolean })}
              />
              <Label htmlFor="numericGoal" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Agregar meta numérica
              </Label>
            </div>

            {numericGoal.enabled && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                {/* Valores principales en 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">Valor objetivo *</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={numericGoal.targetValue}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setNumericGoal({ ...numericGoal, targetValue: value });
                        // Clear error when user enters valid value
                        if (errors.targetValue && value > 0) {
                          setErrors({ ...errors, targetValue: '' });
                        }
                      }}
                      placeholder="Ej: 2000000"
                      className={errors.targetValue ? 'border-destructive' : ''}
                      required={numericGoal.enabled}
                    />
                    {errors.targetValue && (
                      <p className="text-sm text-destructive">{errors.targetValue}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentValue">Valor actual</Label>
                    <Input
                      id="currentValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={numericGoal.currentValue}
                      onChange={(e) => setNumericGoal({ ...numericGoal, currentValue: parseFloat(e.target.value) || 0 })}
                      placeholder="Ej: 500000"
                      className={errors.currentValue ? 'border-destructive' : ''}
                    />
                    {errors.currentValue && (
                      <p className="text-sm text-destructive">{errors.currentValue}</p>
                    )}
                  </div>
                </div>


                {/* Tipo de unidad y unidad en 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitType">Tipo de unidad</Label>
                    <Select
                      value={numericGoal.unitType}
                      onValueChange={(value) => setNumericGoal({ ...numericGoal, unitType: value as NumericGoal['unitType'], unit: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="currency">Moneda</SelectItem>
                        <SelectItem value="weight">Peso</SelectItem>
                        <SelectItem value="quantity">Cantidad</SelectItem>
                        <SelectItem value="percentage">Porcentaje</SelectItem>
                        <SelectItem value="custom">Personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidad *</Label>
                    <Input
                      id="unit"
                      value={numericGoal.unit}
                      onChange={(e) => {
                        setNumericGoal({ ...numericGoal, unit: e.target.value });
                        // Clear error when user starts typing
                        if (errors.unit && e.target.value.trim()) {
                          setErrors({ ...errors, unit: '' });
                        }
                      }}
                      placeholder={getUnitPlaceholder(numericGoal.unitType)}
                      className={errors.unit ? 'border-destructive' : ''}
                      required={numericGoal.enabled}
                    />
                    {errors.unit && (
                      <p className="text-sm text-destructive">{errors.unit}</p>
                    )}
                  </div>
                </div>

                {/* Ejemplos compactos */}
                <div className="text-sm text-gray-600 bg-white p-3 rounded-md">
                  <p className="font-medium mb-1">Ejemplos:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                    <span>• Comprar colchón: 2,000,000 COP</span>
                    <span>• Bajar peso: 3 kg</span>
                    <span>• Ahorrar dinero: 500,000 COP</span>
                    <span>• Completar curso: 100 %</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit()}
            >
              {isSubmitting ? 'Guardando...' : goal ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};