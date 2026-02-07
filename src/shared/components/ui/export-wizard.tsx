import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface ExportField {
  id: string;
  label: string;
  description?: string;
}

export interface ExportOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  fields?: ExportField[];
}

export interface ExportWizardConfig {
  title: string;
  options: ExportOption[];
  dataGenerator: (selectedOptions: string[], selectedFields: Record<string, string[]>) => any;
}

interface ExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ExportWizardConfig;
}

export const ExportWizard: React.FC<ExportWizardProps> = ({
  open,
  onOpenChange,
  config
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({});
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const optionsWithFields = config.options.filter(option => option.fields && option.fields.length > 0);
  const totalSteps = optionsWithFields.length > 0 ? 3 : 2; // Paso 1: Opciones, Paso 2: Campos (opcional), Paso final: JSON

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleFieldToggle = (optionId: string, fieldId: string) => {
    setSelectedFields(prev => {
      const current = prev[optionId] || [];
      const updated = current.includes(fieldId)
        ? current.filter(id => id !== fieldId)
        : [...current, fieldId];
      
      return { ...prev, [optionId]: updated };
    });
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Paso 1 -> Paso 2 o Final
      const needsFieldSelection = selectedOptions.some(optionId => 
        config.options.find(opt => opt.id === optionId)?.fields
      );
      
      if (needsFieldSelection) {
        setCurrentStep(1);
      } else {
        generateJson();
        setCurrentStep(totalSteps - 1);
      }
    } else if (currentStep === 1) {
      // Paso 2 -> Final
      generateJson();
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateJson = () => {
    const json = config.dataGenerator(selectedOptions, selectedFields);
    setGeneratedJson(JSON.stringify(json, null, 2));
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
    setSelectedOptions([]);
    setSelectedFields({});
    setGeneratedJson('');
    setCopied(false);
    onOpenChange(false);
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return selectedOptions.length > 0;
    }
    if (currentStep === 1) {
      return selectedOptions.every(optionId => {
        const option = config.options.find(opt => opt.id === optionId);
        if (!option?.fields) return true;
        return selectedFields[optionId] && selectedFields[optionId].length > 0;
      });
    }
    return true;
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Selecciona qué datos deseas exportar:
      </div>
      <div className="space-y-3">
        {config.options.map(option => (
          <div key={option.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Checkbox
              id={option.id}
              checked={selectedOptions.includes(option.id)}
              onCheckedChange={() => handleOptionToggle(option.id)}
              className="mt-1"
            />
            {option.icon && (
              <div className="mt-1 text-gray-600">
                {option.icon}
              </div>
            )}
            <div className="flex-1">
              <label htmlFor={option.id} className="text-sm font-medium cursor-pointer block">
                {option.label}
              </label>
              {option.description && (
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const optionsWithFieldsSelected = selectedOptions
      .map(id => config.options.find(opt => opt.id === id))
      .filter(opt => opt?.fields);

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Selecciona los campos específicos a incluir:
        </div>
        {optionsWithFieldsSelected.map(option => (
          <Card key={option!.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{option!.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {option!.fields!.map(field => (
                <div key={field.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`${option!.id}-${field.id}`}
                    checked={selectedFields[option!.id]?.includes(field.id) || false}
                    onCheckedChange={() => handleFieldToggle(option!.id, field.id)}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={`${option!.id}-${field.id}`} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {field.label}
                    </label>
                    {field.description && (
                      <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderFinalStep = () => (
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
    switch (currentStep) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderFinalStep();
      default: return renderStep1();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {config.title}
            <span className="text-sm font-normal text-gray-500">
              Paso {currentStep + 1} de {totalSteps}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t">
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