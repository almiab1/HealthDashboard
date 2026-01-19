import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { HistoryTable } from './HistoryTable';
import { getAllRecords } from '../../lib/database';
import type { RegistroCorporal } from '../../utils/data';

export const HistoryDesktop: React.FC = () => {
  const [data, setData] = useState<RegistroCorporal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[HistoryDesktop] Cargando datos...');
      const records = await getAllRecords();
      console.log('[HistoryDesktop] Registros obtenidos:', records.length);
      setData(records);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('[HistoryDesktop] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Recargar cuando se vuelve a esta página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[HistoryDesktop] Página visible, recargando datos...');
        loadData();
      }
    };
    
    const handleFocus = () => {
      console.log('[HistoryDesktop] Ventana enfocada, recargando datos...');
      loadData();
    };
    
    const handleRecordsUpdated = () => {
      console.log('[HistoryDesktop] Evento records-updated recibido');
      loadData();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('records-updated', handleRecordsUpdated);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('records-updated', handleRecordsUpdated);
    };
  }, []);

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
