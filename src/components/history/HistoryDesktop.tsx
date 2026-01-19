import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { HistoryTable } from './HistoryTable';
import { getAllRecords } from '../../lib/database';
import type { RegistroCorporal } from '../../utils/data';

export const HistoryDesktop: React.FC = () => {
  const [data, setData] = useState<RegistroCorporal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const records = await getAllRecords();
      setData(records);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-400">Cargando histórico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return <HistoryTable initialData={data} />;
};
