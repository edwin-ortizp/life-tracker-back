import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Copy, Check, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface ExportField {
  id: string;
  label: string;
  description?: string;
  type?: 'checkbox' | 'custom';
  component?: React.ReactNode;
}

export interface ExportModule {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  fields?: ExportField[];
  dataGenerator: (selectedFields: string[], customValues?: Record<string, any>) => any;
}

export interface ModularExportWizardConfig {
  title: string;
  modules: ExportModule[];
}

interface ModularExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ModularExportWizardConfig;
  customFieldValues?: Record<string, any>;
  onCustomFieldChange?: (moduleId: string, fieldId: string, value: any) => void;
}

export const ModularExportWizard: React.FC<ModularExportWizardProps> = ({
  open,
  onOpenChange,
  config,
  customFieldValues = {},
  onCustomFieldChange: _onCustomFieldChange
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [moduleFields, setModuleFields] = useState<Record<string, string[]>>({});
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Paso 0: Selección de módulos
  // Pasos 1-N: Configuración de campos para cada módulo seleccionado
  // Paso final: Mostrar JSON generado

  const selectedModulesData = selectedModules
    .map(id => config.modules.find(m => m.id === id))
    .filter((m): m is ExportModule => m !== undefined);

  const selectedModulesWithFields = selectedModulesData
    .filter(m => m.fields && m.fields.length > 0);

  const totalSteps = 1 + selectedModulesWithFields.length + 1; // Selección + Campos + JSON

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleFieldToggle = (moduleId: string, fieldId: string) => {
    setModuleFields(prev => {
      const current = prev[moduleId] || [];
      const updated = current.includes(fieldId)
        ? current.filter(id => id !== fieldId)
        : [...current, fieldId];
      
      return { ...prev, [moduleId]: updated };
    });
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Ir al primer módulo con campos o al final si no hay módulos con campos
      if (selectedModulesWithFields.length > 0) {
        setCurrentStep(1);
      } else {
        generateJson();
        setCurrentStep(totalSteps - 1);
      }
    } else if (currentStep < totalSteps - 1) {
      if (currentStep === selectedModulesWithFields.length) {
        // Último paso de configuración -> generar JSON
        generateJson();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateJson = () => {
    const result: any = {};
    
    // Procesar todos los módulos seleccionados (con y sin fields)
    selectedModulesData.forEach(module => {
      if (module) {
        const selectedFields = moduleFields[module.id] || [];
        const moduleCustomValues = customFieldValues[module.id] || {};
        const moduleData = module.dataGenerator(selectedFields, moduleCustomValues);
        if (moduleData && Object.keys(moduleData).length > 0) {
          Object.assign(result, moduleData);
        }
      }
    });

    setGeneratedJson(JSON.stringify(result, null, 2));
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedJson);
      setCopied(true);
      toast.success('JSON copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setSelectedModules([]);
    setModuleFields({});
    setGeneratedJson('');
    setCopied(false);
    onOpenChange(false);
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return selectedModules.length > 0;
    }
    if (currentStep > 0 && currentStep <= selectedModulesWithFields.length) {
      const moduleIndex = currentStep - 1;
      const module = selectedModulesWithFields[moduleIndex];
      if (!module) return true;
      
      // Si el módulo tiene solo campos custom, siempre permitir proceder
      const hasOnlyCustomFields = module.fields?.every(field => field.type === 'custom');
      if (hasOnlyCustomFields) return true;
      
      // Si tiene campos regulares, requiere al menos uno seleccionado
      const selectedFields = moduleFields[module.id] || [];
      const hasRegularFields = module.fields?.some(field => field.type !== 'custom');
      
      if (hasRegularFields) {
        return selectedFields.length > 0;
      }
      
      // Si no tiene campos, permitir proceder
      return true;
    }
    return true;
  };

  const renderModuleSelection = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Selecciona los módulos que deseas exportar:
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {config.modules.map(module => (
          <div key={module.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Checkbox
              id={module.id}
              checked={selectedModules.includes(module.id)}
              onCheckedChange={() => handleModuleToggle(module.id)}
              className="mt-1"
            />
            {module.icon && (
              <div className="mt-1 text-gray-600">
                {module.icon}
              </div>
            )}
            <div className="flex-1">
              <label htmlFor={module.id} className="text-sm font-medium cursor-pointer block">
                {module.label}
              </label>
              {module.description && (
                <p className="text-xs text-gray-500 mt-1">{module.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderModuleFields = (moduleIndex: number) => {
    const module = selectedModulesWithFields[moduleIndex];
    if (!module || !module.fields) return null;

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Configura los campos para <strong>{module.label}</strong>:
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {module.icon}
              {module.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {module.fields.map(field => (
                <div key={field.id}>
                  {field.type === 'custom' && field.component ? (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium block">
                        {field.label}
                      </label>
                      {field.description && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                      )}
                      {field.component}
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`${module.id}-${field.id}`}
                        checked={moduleFields[module.id]?.includes(field.id) || false}
                        onCheckedChange={() => handleFieldToggle(module.id, field.id)}
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`${module.id}-${field.id}`} 
                          className="text-sm font-medium cursor-pointer block"
                        >
                          {field.label}
                        </label>
                        {field.description && (
                          <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderJsonResult = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Aquí está tu JSON generado. Puedes copiarlo al portapapeles:
      </div>
      <div className="relative">
        <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96 border">
          {generatedJson}
        </pre>
        <Button
          onClick={handleCopyToClipboard}
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 gap-2"
          disabled={copied}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (currentStep === 0) {
      return renderModuleSelection();
    } else if (currentStep <= selectedModulesWithFields.length) {
      return renderModuleFields(currentStep - 1);
    } else {
      return renderJsonResult();
    }
  };

  const getStepTitle = () => {
    if (currentStep === 0) {
      return 'Seleccionar Módulos';
    } else if (currentStep <= selectedModulesWithFields.length) {
      const module = selectedModulesWithFields[currentStep - 1];
      return `Configurar ${module?.label}`;
    } else {
      return 'Resultado';
    }
  };

  const renderBreadcrumb = () => {
    const steps = [
      { label: 'Módulos', isCompleted: currentStep > 0, isCurrent: currentStep === 0 }
    ];

    // Agregar pasos de configuración de módulos (solo los que tienen fields)
    selectedModulesWithFields.forEach((module, index) => {
      const stepIndex = index + 1;
      if (module) {
        steps.push({
          label: module.label,
          isCompleted: currentStep > stepIndex,
          isCurrent: currentStep === stepIndex
        });
      }
    });

    // Agregar paso final
    steps.push({
      label: 'Resultado',
      isCompleted: false,
      isCurrent: currentStep === totalSteps - 1
    });

    return (
      <div className="bg-gray-50 border-b">
        {/* Breadcrumb de navegación */}
        <div className="flex items-center justify-center space-x-2 py-4 px-6">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.isCompleted 
                    ? 'bg-green-500 text-white' 
                    : step.isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step.isCurrent ? 'text-blue-600' : step.isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Mostrar todos los módulos seleccionados */}
        {currentStep > 0 && selectedModulesData.length > 0 && (
          <div className="px-6 pb-3">
            <div className="text-xs text-gray-500 mb-1">Módulos seleccionados:</div>
            <div className="flex flex-wrap gap-1">
              {selectedModulesData.map(module => module && (
                <span 
                  key={module.id} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {module.icon}
                  {module.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <span>{config.title}</span>
              <span className="text-sm font-normal text-gray-500 mt-1">
                {getStepTitle()}
              </span>
            </div>
            <span className="text-sm font-normal text-gray-500">
              Paso {currentStep + 1} de {totalSteps}
            </span>
          </DialogTitle>
        </DialogHeader>

        {renderBreadcrumb()}
        
        <div className="px-6 pb-6">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between px-6 py-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {currentStep < totalSteps - 1 ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleClose}>
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};