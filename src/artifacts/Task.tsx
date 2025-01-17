import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle, Plus, X } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

const Task = () => {
  interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: {
      seconds: number;
    };
  }

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;

    // Consulta más simple que solo filtra por usuario
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const taskList = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              completed: data.completed,
              createdAt: data.createdAt
            };
          })
          // Filtramos las completadas y ordenamos por fecha en el cliente
          .filter(task => !task.completed)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
        setTasks(taskList);
        setStatus('saved');
      },
      (error) => {
        console.error('Error en snapshot:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;

    setStatus('saving');
    setError(null);

    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: newTask.trim(),
        completed: false,
        createdAt: serverTimestamp()
      });

      setNewTask('');
      setStatus('saved');
    } catch (error) {
      setError(error.message);
      setStatus('error');
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user) return;

    setStatus('saving');
    
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !completed,
        updatedAt: serverTimestamp()
      });
      
      setStatus('saved');
    } catch (error) {
      setError(error.message);
      setStatus('error');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    setStatus('saving');
    
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setStatus('saved');
    } catch (error) {
      setError(error.message);
      setStatus('error');
    }
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para gestionar tus tareas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-medium text-lg">Tareas Pendientes</h3>
          {status === 'saving' && (
            <span className="text-xs text-blue-500">Guardando...</span>
          )}
        </div>

        <form onSubmit={addTask} className="flex gap-2 mb-4">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
            >
              <button
                onClick={() => toggleTask(task.id, task.completed)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <span className={task.completed ? 'line-through text-gray-400' : ''}>
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="ml-auto p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Task;