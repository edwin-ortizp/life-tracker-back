import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Calendar, Heart, Zap, BookOpen, CheckSquare } from 'lucide-react';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateForInput } from '@/utils/dates';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';
import type { DailyMood, DailyEnergy } from '@/features/mood/types';
import type { Task } from '@/features/task/types';
import type { JournalEntry } from '../types';

interface SimpleJournalExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExportConfig {
  includeJournal: boolean;
  includeMoods: boolean;
  includeEnergy: boolean;
  includePrivateTasks: boolean;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const SimpleJournalExportWizard: React.FC<SimpleJournalExportWizardProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'config' | 'processing'>('config');
  const [dateOption, setDateOption] = useState<'thisWeek' | 'lastWeek' | 'custom'>('thisWeek');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeJournal: true,
    includeMoods: true,
    includeEnergy: true,
    includePrivateTasks: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleConfigChange = (key: keyof ExportConfig, value: boolean) => {
    setExportConfig(prev => ({ ...prev, [key]: value }));
  };

  const getDateRange = (): { start: Date; end: Date } => {
    const today = new Date();
    
    if (dateOption === 'thisWeek') {
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
      };
    } else if (dateOption === 'lastWeek') {
      const last = subWeeks(today, 1);
      return {
        start: startOfWeek(last, { weekStartsOn: 1 }),
        end: endOfWeek(last, { weekStartsOn: 1 })
      };
    } else {
      return { start: startDate, end: endDate };
    }
  };

  const fetchDataForRange = async (start: Date, end: Date) => {
    if (!user) return { journals: [], moods: [], energy: [], privateTasks: [] };

    const journals: JournalEntry[] = [];
    const moods: DailyMood[] = [];
    const energy: DailyEnergy[] = [];

    // Fetch data for each day in range
    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const dateStr = getLocalDateString(current);

      // Journal entries
      if (exportConfig.includeJournal) {
        const journalRef = doc(db, 'journal', `${user.uid}_${dateStr}`);
        const journalSnap = await getDoc(journalRef);
        if (journalSnap.exists()) {
          journals.push({
            userId: user.uid,
            text: journalSnap.data().text || '',
            date: dateStr,
            lastUpdated: journalSnap.data().lastUpdated || new Date(),
            displayTime: journalSnap.data().displayTime || ''
          });
        }
      }

      // Mood data
      if (exportConfig.includeMoods) {
        const moodRef = doc(db, 'moods', `${user.uid}_${dateStr}`);
        const moodSnap = await getDoc(moodRef);
        if (moodSnap.exists()) {
          moods.push(moodSnap.data() as DailyMood);
        }
      }

      // Energy data
      if (exportConfig.includeEnergy) {
        const energyRef = doc(db, 'energy', `${user.uid}_${dateStr}`);
        const energySnap = await getDoc(energyRef);
        if (energySnap.exists()) {
          energy.push(energySnap.data() as DailyEnergy);
        }
      }
    }

    // Fetch private tasks for the date range
    let privateTasks: Task[] = [];
    if (exportConfig.includePrivateTasks) {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('isPrivate', '==', true)
      );
      const tasksSnap = await getDocs(tasksQuery);
      privateTasks = tasksSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Task))
        .filter(task => {
          if (!task.createdAt?.seconds) return false;
          const taskDate = new Date(task.createdAt.seconds * 1000);
          const taskDateStr = getLocalDateString(taskDate);
          const startStr = getLocalDateString(start);
          const endStr = getLocalDateString(end);
          return taskDateStr >= startStr && taskDateStr <= endStr;
        });
    }

    return { journals, moods, energy, privateTasks };
  };

  const generateMarkdown = async () => {
    if (!user) return;

    const { start, end } = getDateRange();
    const { journals, moods, energy, privateTasks } = await fetchDataForRange(start, end);

    let content = `# Diario del ${format(start, 'dd MMMM yyyy', { locale: es })} al ${format(end, 'dd MMMM yyyy', { locale: es })}\n\n`;

    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const dateStr = getLocalDateString(current);
      const heading = format(current, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
      content += `### ${capitalize(heading)}\n\n`;

      let hasContent = false;

      // Add mood data if included
      if (exportConfig.includeMoods) {
        const dayMoods = moods.find(m => m.date === dateStr);
        if (dayMoods?.moods && dayMoods.moods.length > 0) {
          content += `**Estados de ánimo:**\n`;
          dayMoods.moods.forEach(mood => {
            content += `- ${mood.time}: ${mood.emoji} ${mood.text}\n`;
          });
          content += `\n`;
          hasContent = true;
        }
      }

      // Add energy data if included
      if (exportConfig.includeEnergy) {
        const dayEnergy = energy.find(e => e.date === dateStr);
        if (dayEnergy?.entries && dayEnergy.entries.length > 0) {
          content += `**Niveles de energía:**\n`;
          dayEnergy.entries.forEach(entry => {
            const comment = entry.comment ? ` - ${entry.comment}` : '';
            content += `- ${entry.time}: Nivel ${entry.level}/5${comment}\n`;
          });
          content += `\n`;
          hasContent = true;
        }
      }

      // Add private tasks if included
      if (exportConfig.includePrivateTasks) {
        const dayTasks = privateTasks.filter(task => {
          if (!task.createdAt?.seconds) return false;
          const taskDate = new Date(task.createdAt.seconds * 1000);
          return getLocalDateString(taskDate) === dateStr;
        });
        
        if (dayTasks.length > 0) {
          content += `**Tareas privadas:**\n`;
          dayTasks.forEach(task => {
            const status = task.completed ? '✅' : '◯';
            const description = task.description ? ` - ${task.description}` : '';
            content += `- ${status} ${task.title}${description}\n`;
          });
          content += `\n`;
          hasContent = true;
        }
      }

      // Add journal text if included
      if (exportConfig.includeJournal) {
        const dayJournal = journals.find(j => j.date === dateStr);
        if (dayJournal?.text && dayJournal.text.trim()) {
          content += `**Diario:**\n${dayJournal.text}\n\n`;
          hasContent = true;
        }
      }

      // Add placeholder if no content for this day
      if (!hasContent) {
        content += `_Sin entradas para este día_\n\n`;
      }
    }

    // Download the markdown file
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getLocalDateString(start)}_a_${getLocalDateString(end)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setCurrentStep('processing');
    
    try {
      await generateMarkdown();
      // Close dialog after successful export
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('config');
    setIsExporting(false);
    onOpenChange(false);
  };

  const canExport = () => {
    return Object.values(exportConfig).some(Boolean);
  };

  const getDateRangeLabel = () => {
    const { start, end } = getDateRange();
    return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Diario
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'config' && (
          <div className="space-y-6">
            {/* Date Range Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Rango de fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={dateOption} onValueChange={val => setDateOption(val as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar rango" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisWeek">Esta semana</SelectItem>
                    <SelectItem value="lastWeek">Semana pasada</SelectItem>
                    <SelectItem value="custom">Rango personalizado</SelectItem>
                  </SelectContent>
                </Select>
                
                {dateOption === 'custom' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="border rounded-md px-2 py-1 flex-1 text-sm"
                      value={formatDateForInput(startDate)}
                      onChange={e => setStartDate(new Date(e.target.value))}
                      placeholder="Fecha de inicio"
                      title="Fecha de inicio"
                    />
                    <input
                      type="date"
                      className="border rounded-md px-2 py-1 flex-1 text-sm"
                      value={formatDateForInput(endDate)}
                      onChange={e => setEndDate(new Date(e.target.value))}
                      placeholder="Fecha de fin"
                      title="Fecha de fin"
                    />
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Exportando: {getDateRangeLabel()}
                </div>
              </CardContent>
            </Card>

            {/* Content Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contenido a incluir</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="journal"
                      checked={exportConfig.includeJournal}
                      onCheckedChange={(checked) => handleConfigChange('includeJournal', !!checked)}
                      className="mt-1"
                    />
                    <div className="flex items-start gap-2 flex-1">
                      <BookOpen className="w-4 h-4 mt-1 text-gray-600" />
                      <div>
                        <label htmlFor="journal" className="text-sm font-medium cursor-pointer block">
                          Entradas del diario
                        </label>
                        <p className="text-xs text-gray-500">Contenido textual del diario personal</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="moods"
                      checked={exportConfig.includeMoods}
                      onCheckedChange={(checked) => handleConfigChange('includeMoods', !!checked)}
                      className="mt-1"
                    />
                    <div className="flex items-start gap-2 flex-1">
                      <Heart className="w-4 h-4 mt-1 text-gray-600" />
                      <div>
                        <label htmlFor="moods" className="text-sm font-medium cursor-pointer block">
                          Estados de ánimo
                        </label>
                        <p className="text-xs text-gray-500">Emociones registradas con hora y emoji</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="energy"
                      checked={exportConfig.includeEnergy}
                      onCheckedChange={(checked) => handleConfigChange('includeEnergy', !!checked)}
                      className="mt-1"
                    />
                    <div className="flex items-start gap-2 flex-1">
                      <Zap className="w-4 h-4 mt-1 text-gray-600" />
                      <div>
                        <label htmlFor="energy" className="text-sm font-medium cursor-pointer block">
                          Niveles de energía
                        </label>
                        <p className="text-xs text-gray-500">Registros de energía del 1-5 con comentarios</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="tasks"
                      checked={exportConfig.includePrivateTasks}
                      onCheckedChange={(checked) => handleConfigChange('includePrivateTasks', !!checked)}
                      className="mt-1"
                    />
                    <div className="flex items-start gap-2 flex-1">
                      <CheckSquare className="w-4 h-4 mt-1 text-gray-600" />
                      <div>
                        <label htmlFor="tasks" className="text-sm font-medium cursor-pointer block">
                          Tareas privadas
                        </label>
                        <p className="text-xs text-gray-500">Tareas marcadas como privadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Generando archivo markdown...</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {currentStep === 'config' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={!canExport() || isExporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};