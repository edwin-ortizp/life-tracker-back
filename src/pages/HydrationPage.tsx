import React, { useState, useEffect } from 'react';
import DateSelector from '../components/DateSelector';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  Droplet,
  Coffee,
  Glasses,
  Edit2,
  Trash2,
  X,
  Check,
  Clock,
  Plus
} from 'lucide-react';

const DRINKS = {
  water: { 
    name: 'Agua', 
    icon: Droplet, 
    hydrationFactor: 1,
    color: 'text-blue-500',
    amounts: [100, 200, 300, 400, 500]
  },
  milk: { 
    name: 'Leche', 
    icon: Glasses,
    hydrationFactor: 0.9,
    color: 'text-gray-500',
    amounts: [100, 200, 300]
  },
  tea: {
    name: 'Té',
    icon: Coffee,
    hydrationFactor: 0.85,
    color: 'text-amber-600',
    amounts: [100, 200, 300]
  },
  coffee: { 
    name: 'Café', 
    icon: Coffee, 
    hydrationFactor: 0.8,
    color: 'text-amber-800',
    amounts: [100, 200, 300]
  },
  juice: {
    name: 'Jugo',
    icon: Glasses,
    hydrationFactor: 0.85,
    color: 'text-orange-500',
    amounts: [100, 200, 300]
  }
};

// Componente modal de edición/creación
const DrinkFormModal = ({ drink = null, onSave, onClose }) => {
  const initialTime = drink 
    ? new Date(drink.timestamp).toTimeString().slice(0, 5)
    : new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    type: drink?.type || 'water',
    amount: drink?.amount || 200,
    time: initialTime
  });

  const handleSave = () => {
    const [hours, minutes] = form.time.split(':');
    const timestamp = new Date();
    timestamp.setHours(parseInt(hours), parseInt(minutes), 0);

    onSave({
      type: form.type,
      amount: form.amount,
      timestamp: timestamp.toISOString(),
      time: timestamp.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      hydration: form.amount * DRINKS[form.type].hydrationFactor
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">
          {drink ? 'Editar Registro' : 'Nuevo Registro'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de bebida
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({...form, type: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              {Object.entries(DRINKS).map(([key, drink]) => (
                <option key={key} value={key}>{drink.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad (ml)
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({...form, amount: parseInt(e.target.value) || 0})}
              className="w-full p-2 border rounded-lg"
              min="0"
              step="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({...form, time: e.target.value})}
                className="flex-1 p-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

const HydrationPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weeklyData, setWeeklyData] = useState([]);
  const [drinkDistribution, setDrinkDistribution] = useState([]);
  const [dayRecords, setDayRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [status, setStatus] = useState('idle');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchWeeklyData = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const q = query(
          collection(db, 'water'),
          where('userId', '==', user.uid),
          where('date', '>=', startDate.toISOString().split('T')[0]),
          where('date', '<=', endDate.toISOString().split('T')[0]),
          orderBy('date')
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          date: doc.data().date,
          total: doc.data().totalHydration || 0
        }));

        setWeeklyData(data);
      } catch (error) {
        console.error('Error fetching weekly data:', error);
      }
    };

    const fetchDayRecords = async () => {
      const dateString = selectedDate.toISOString().split('T')[0];
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);
      
      try {
        const docSnap = await getDocs(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDayRecords(data.drinks || []);
        } else {
          setDayRecords([]);
        }
      } catch (error) {
        console.error('Error fetching day records:', error);
      }
    };

    fetchWeeklyData();
    fetchDayRecords();
  }, [user, selectedDate]);

  const handleSaveRecord = async (recordData) => {
    if (!user) return;
    setStatus('saving');

    const dateString = selectedDate.toISOString().split('T')[0];
    const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

    try {
      let updatedRecords;
      if (editingRecord) {
        // Actualizar registro existente
        updatedRecords = dayRecords.map(record => 
          record.timestamp === editingRecord.timestamp ? recordData : record
        );
      } else {
        // Añadir nuevo registro
        updatedRecords = [...dayRecords, recordData];
      }

      // Ordenar por timestamp
      updatedRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const totalHydration = updatedRecords.reduce(
        (sum, record) => sum + record.hydration, 
        0
      );

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedRecords,
        totalHydration,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setDayRecords(updatedRecords);
      setEditingRecord(null);
      setShowNewRecordModal(false);
      setStatus('idle');
    } catch (error) {
      console.error('Error saving record:', error);
      setStatus('error');
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!user || !confirm('¿Estás seguro de eliminar este registro?')) return;
    
    setStatus('saving');
    const dateString = selectedDate.toISOString().split('T')[0];
    const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

    try {
      const updatedRecords = dayRecords.filter(r => r.timestamp !== record.timestamp);
      const totalHydration = updatedRecords.reduce(
        (sum, record) => sum + record.hydration, 
        0
      );

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedRecords,
        totalHydration,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setDayRecords(updatedRecords);
      setStatus('idle');
    } catch (error) {
      console.error('Error deleting record:', error);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Hidratación</h1>
        <button
          onClick={() => setShowNewRecordModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Registro
        </button>
      </div>

      <DateSelector 
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de registros */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <h2 className="font-medium mb-4">Registros del día</h2>
          <div className="space-y-2">
            {dayRecords.map((record) => {
              const drinkInfo = DRINKS[record.type];
              const Icon = drinkInfo.icon;

              return (
                <div 
                  key={record.timestamp}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <Icon className={`w-4 h-4 ${drinkInfo.color}`} />
                  <span className="font-medium">{drinkInfo.name}</span>
                  <span className="text-gray-500">{record.amount}ml</span>
                  <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {record.time}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingRecord(record)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}

            {dayRecords.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No hay registros para este día
              </div>
            )}
          </div>
        </div>

    {/* Panel de estadísticas */}
    <div className="space-y-6">
          {/* Gráfico de consumo semanal */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">Consumo Semanal</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#2563eb" 
                    name="Total (ml)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resumen semanal */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">Resumen Semanal</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Total del día:</span>
                <span className="font-medium">
                  {dayRecords.reduce((sum, record) => sum + record.hydration, 0)} ml
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Promedio diario:</span>
                <span className="font-medium">
                  {weeklyData.length > 0
                    ? Math.round(
                        weeklyData.reduce((acc, day) => acc + day.total, 0) / 
                        weeklyData.length
                      )
                    : 0
                  } ml
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Meta diaria:</span>
                <span className="font-medium">2000 ml</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Días meta alcanzada:</span>
                <span className="font-medium">
                  {weeklyData.filter(day => day.total >= 2000).length}/7
                </span>
              </div>
            </div>
          </div>

          {/* Distribución por tipo de bebida */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">Distribución por Tipo</h3>
            <div className="space-y-2">
              {Object.entries(DRINKS).map(([key, drink]) => {
                const Icon = drink.icon;
                const total = dayRecords
                  .filter(record => record.type === key)
                  .reduce((sum, record) => sum + record.amount, 0);
                
                if (total === 0) return null;

                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${drink.color}`} />
                    <span>{drink.name}</span>
                    <span className="ml-auto font-medium">{total}ml</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición/creación */}
      {(editingRecord || showNewRecordModal) && (
        <DrinkFormModal
          drink={editingRecord}
          onSave={handleSaveRecord}
          onClose={() => {
            setEditingRecord(null);
            setShowNewRecordModal(false);
          }}
        />
      )}

      {/* Estado de guardado */}
      {status === 'saving' && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow">
          Guardando...
        </div>
      )}

      {status === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow">
          Error al guardar
        </div>
      )}
    </div>
  );
};

export default HydrationPage;