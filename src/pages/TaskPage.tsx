// src/pages/TaskPage.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Task, TaskWeekView, TaskKanbanView, TaskAiSuggestion, TaskAiReprioritize } from '@/features/task/components';
import RecurrenceModal from '@/features/task/components/RecurrenceModal';
import { CompactTaskHeader } from '@/components/navigation/CompactTaskHeader';
import { Plus, Upload, Download, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FirestoreErrorHandler } from '@/components/ui/FirestoreErrorHandler';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useTaskData } from '@/features/task/hooks/useTaskData';
import { db } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface TaskPageProps {
  defaultTab?: 'list' | 'kanban' | 'analytics' | 'week';
}

const TaskPage: React.FC<TaskPageProps> = ({ defaultTab = 'list' }) => {
  const [taskStats, setTaskStats] = useState<any[]>([]);
  const [completionStats, setCompletionStats] = useState<any[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [showAiReprioritize, setShowAiReprioritize] = useState(false);
  const [currentTab, setCurrentTab] = useState<'list' | 'kanban' | 'analytics' | 'week'>(defaultTab);
  
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab as 'list' | 'kanban' | 'analytics' | 'week');
  };
  const { user } = useAuth();
  const taskData = useTaskData();
  const {
    tasks,
    showRecurrenceModal,
    currentTask,
    modalMode,
    addTask,
    editTask,
    completeRecurrentTask,
    setShowRecurrenceModal,
    openCreateModal
  } = taskData;

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    // Obtener estadísticas de tareas completadas vs pendientes
    // Usar consulta simple para evitar problemas de índice
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime(); // ordenar por fecha desc
      });
    
    // Calcular estadísticas por día
    const dailyStats = tasks.reduce((acc: any, task) => {
      const date = task.createdAt?.toDate?.()?.toISOString?.().split('T')[0] || 'unknown';
      if (!acc[date]) {
        acc[date] = { date, completed: 0, pending: 0 };
      }
      acc[date][task.completed ? 'completed' : 'pending']++;
      return acc;
    }, {});

    setTaskStats(Object.values(dailyStats));

    // Calcular totales para el gráfico circular
    const totalCompleted = tasks.filter(task => task.completed).length;
    const totalPending = tasks.filter(task => !task.completed).length;

    setCompletionStats([
      { name: 'Completadas', value: totalCompleted },
      { name: 'Pendientes', value: totalPending }
    ]);
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <CompactTaskHeader 
          title="Tareas"
          actions={[]}
          currentTab={currentTab}
          onTabChange={handleTabChange}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold">Inicia sesión para ver tus tareas</h2>
          </div>
        </div>
      </div>
    );
  }

  // Task actions for header
  const handleNewTask = () => {
    openCreateModal();
  };

  const handleImportTasks = () => {
    setShowImportDialog(true);
  };

  const handleImportTasksConfirm = () => {
    try {
      const tasksToImport = JSON.parse(importJson);
      
      if (!Array.isArray(tasksToImport)) {
        toast.error('El JSON debe contener un array de tareas');
        return;
      }

      let importedCount = 0;
      let invalidDatesCount = 0;
      
      tasksToImport.forEach((taskData: any) => {
        if (taskData.title) {
          let dueDate = undefined;
          
          // Manejo mejorado de fechas
          if (taskData.dueDate) {
            const parsedDate = new Date(taskData.dueDate);
            if (!isNaN(parsedDate.getTime())) {
              dueDate = parsedDate;
            } else {
              invalidDatesCount++;
              console.warn(`Fecha inválida para tarea "${taskData.title}": ${taskData.dueDate}`);
            }
          }
          
          // Note: This would need to be connected to the Task component's addTask function
          console.log('Would import task:', {
            title: taskData.title,
            description: taskData.description || '',
            dueDate: dueDate,
            category: taskData.category || 'personal',
            priority: taskData.priority || undefined,
            isPrivate: false,
            isRecurrent: taskData.isRecurrent || false,
            size: taskData.size || undefined
          });
          importedCount++;
        }
      });

      if (invalidDatesCount > 0) {
        toast.warning(`${importedCount} tareas procesadas. ${invalidDatesCount} fechas inválidas fueron omitidas.`);
      } else {
        toast.success(`${importedCount} tareas procesadas correctamente`);
      }
      
      setImportJson('');
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Error al importar las tareas. Verifica el formato JSON.');
      console.error('Error de importación:', error);
    }
  };

  const handleExportTasks = () => {
    // Note: This would need to be connected to the Task component's tasks data
    toast.success('Funcionalidad de exportar - será implementada');
  };

  const handleAiMenu = () => {
    // El dropdown se maneja directamente en el CompactTaskHeader, no necesitamos hacer nada aquí
  };

  const taskActions = [
    {
      id: 'new',
      label: 'Nueva Tarea',
      icon: <Plus className="h-4 w-4" />,
      onClick: handleNewTask,
      tooltip: 'Crear nueva tarea'
    },
    {
      id: 'import',
      label: 'Importar',
      icon: <Upload className="h-4 w-4" />,
      onClick: handleImportTasks,
      tooltip: 'Importar tareas'
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: <Download className="h-4 w-4" />,
      onClick: handleExportTasks,
      tooltip: 'Exportar tareas'
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      icon: <Brain className="h-4 w-4" />,
      onClick: handleAiMenu,
      tooltip: 'Asistente IA',
      dropdown: [
        {
          label: 'Sugerir tareas',
          onClick: () => setShowAiSuggestion(true)
        },
        {
          label: 'Repriorizar visibles', 
          onClick: () => setShowAiReprioritize(true)
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <CompactTaskHeader 
        title="Tareas"
        actions={taskActions}
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />
      
      <div className="p-4">
        {taskData.error && (
          <div className="mb-4">
            <FirestoreErrorHandler 
              error={taskData.error} 
              onRetry={taskData.loadTasks}
              showClearCache={true}
            />
          </div>
        )}
        
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">

        <TabsContent value="list" className="space-y-4">
          <Task />
        </TabsContent>
        <TabsContent value="kanban" className="space-y-4">
          <TaskKanbanView />
        </TabsContent>
        <TabsContent value="week" className="space-y-4">
          <TaskWeekView />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 desktop-grid-responsive">
            <Card className="desktop-card-enhanced">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Progreso de Tareas</h3>
                <div className="h-64 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={taskStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        name="Completadas"
                        stroke="#8884d8" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        name="Pendientes"
                        stroke="#82ca9d" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="desktop-card-enhanced">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Estado General</h3>
                <div className="h-64 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={completionStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                          name
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = 25 + innerRadius + (outerRadius - innerRadius);
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#888"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                            >
                              {`${name} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                          );
                        }}
                      >
                        {completionStats.map((index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Task AI Components */}
      <TaskAiSuggestion 
        tasks={tasks} 
        open={showAiSuggestion} 
        onOpenChange={setShowAiSuggestion} 
      />
      <TaskAiReprioritize 
        tasks={tasks} 
        onUpdate={editTask} 
        open={showAiReprioritize} 
        onOpenChange={setShowAiReprioritize} 
      />

      {/* Recurrence Modal for new task creation */}
      <RecurrenceModal
        isOpen={showRecurrenceModal}
        onClose={() => setShowRecurrenceModal()}
        onConfirm={(data: any) => {
          if (modalMode === 'complete') {
            completeRecurrentTask(data);
          } else if (modalMode === 'edit') {
            editTask(currentTask!.id, data);
          } else {
            addTask(data);
          }
        }}
        task={currentTask || {
          id: '',
          title: '',
          completed: false,
          category: 'personal',
          createdAt: { seconds: Date.now() / 1000 }
        }}
        mode={modalMode}
      />

      {/* Import Tasks Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Importar Tareas</DialogTitle>
            <DialogDescription>
              Pega el JSON con las tareas a importar. Puedes incluir fechas en varios formatos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={`Ejemplo - Importa tareas con fechas en diferentes formatos:
[
  {
    "title": "Completar proyecto importante",
    "description": "Terminar la implementación",
    "dueDate": "2024-12-31",
    "category": "work",
    "priority": "do",
    "size": "grande"
  },
  {
    "title": "Revisión médica anual", 
    "description": "Chequeo general de salud",
    "dueDate": "2024-07-15T09:00:00Z",
    "category": "health",
    "priority": "decide"
  },
  {
    "title": "Tarea flexible",
    "description": "Esta tarea no tiene fecha límite específica",
    "category": "personal",
    "isRecurrent": true
  }
]

Formatos de fecha soportados:
- "2024-12-31" (solo fecha)
- "2024-06-15T14:30:00Z" (fecha y hora ISO)
- "2024-06-15T14:30:00" (fecha y hora local)
- Sin campo "dueDate" = sin fecha asignada

Campos opcionales:
- description, dueDate, priority, size, isRecurrent`}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleImportTasksConfirm} disabled={!importJson.trim()}>
                Importar Tareas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskPage;