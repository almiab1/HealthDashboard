import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { DateFilter } from './DateFilter';
import { getAllRecords } from '../../lib/database';
import type { RegistroCorporal } from '../../utils/data';

interface DataWithDelta extends RegistroCorporal {
  delta?: {
    Peso: number;
    IMC: number;
    GrasaKg: number;
    GrasaPorc: number;
    MasaLibreKg: number;
    MusculoKg: number;
    AguaKg: number;
    AguaPorc: number;
    MetabolismoBasal: number;
    EdadMetabolica: number;
    GrasaVisceral: number;
    MasaOsea: number;
    AnguloFase: number;
    Resistencia: number;
    Reactancia: number;
  }
}

function calculateDelta(last: RegistroCorporal, previous: RegistroCorporal): DataWithDelta['delta'] {
  return {
    Peso: Number((last.Peso - previous.Peso).toFixed(2)),
    IMC: Number((last.IMC - previous.IMC).toFixed(2)),
    GrasaKg: Number((last.GrasaKg - previous.GrasaKg).toFixed(2)),
    GrasaPorc: Number((last.GrasaPorc - previous.GrasaPorc).toFixed(2)),
    MasaLibreKg: Number((last.MasaLibreKg - previous.MasaLibreKg).toFixed(2)),
    MusculoKg: Number((last.MusculoKg - previous.MusculoKg).toFixed(2)),
    AguaKg: Number((last.AguaKg - previous.AguaKg).toFixed(2)),
    AguaPorc: Number((last.AguaPorc - previous.AguaPorc).toFixed(2)),
    MetabolismoBasal: Number((last.MetabolismoBasal - previous.MetabolismoBasal).toFixed(0)),
    EdadMetabolica: Number((last.EdadMetabolica - previous.EdadMetabolica).toFixed(0)),
    GrasaVisceral: Number((last.GrasaVisceral - previous.GrasaVisceral).toFixed(0)),
    MasaOsea: Number((last.MasaOsea - previous.MasaOsea).toFixed(2)),
    AnguloFase: Number((last.AnguloFase - previous.AnguloFase).toFixed(2)),
    Resistencia: Number((last.Resistencia - previous.Resistencia).toFixed(1)),
    Reactancia: Number((last.Reactancia - previous.Reactancia).toFixed(1)),
  };
}

export const DashboardDesktop: React.FC = () => {
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
        <span className="ml-3 text-gray-400">Cargando datos...</span>
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

  const hasData = data.length > 0;
  const lastRecord = hasData ? data[data.length - 1] : null;
  const previousRecord = data.length > 1 ? data[data.length - 2] : null;
  const delta = lastRecord && previousRecord ? calculateDelta(lastRecord, previousRecord) : null;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Hola, Alex</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Aquí puedes ver tu progreso semanal.</p>
        </div>
        <a 
          href="/register" 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-5 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="mr-2 h-5 w-5" />
          Registrar Nuevas Medidas
        </a>
      </div>

      {/* Section Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-5">
        <h2 className="text-sm sm:text-base font-semibold text-white">Progreso a lo Largo del Tiempo</h2>
        <DateFilter />
      </div>

      {/* Metrics Grid */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {hasData && lastRecord ? (
            <>
              <MetricCard 
                title="Peso (kg)" 
                value={lastRecord.Peso} 
                unit="kg" 
                delta={delta?.Peso} 
                inverseTrend={true}
                data={data}
                dataKey="Peso"
                color="#4ade80"
              />
              <MetricCard 
                title="Porcentaje de Grasa (%)" 
                value={lastRecord.GrasaPorc} 
                unit="%" 
                delta={delta?.GrasaPorc} 
                inverseTrend={true}
                data={data}
                dataKey="GrasaPorc"
                color="#d97706"
              />
              <MetricCard 
                title="Masa Muscular (kg)" 
                value={lastRecord.MusculoKg} 
                unit="kg" 
                delta={delta?.MusculoKg} 
                inverseTrend={false}
                data={data}
                dataKey="MusculoKg"
                color="#38bdf8"
              />
            </>
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              No hay registros disponibles. Empieza registrando una nueva medida.
            </div>
          )}
        </div>
      </div>

      {/* Recent History - Simplified for desktop */}
      {hasData && lastRecord && (
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white mb-4 lg:mb-5">Último Registro</h2>
          <div className="rounded-xl bg-[#111c16] border border-[#1e3327] p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Fecha</p>
                <p className="text-white font-medium">{lastRecord.Fecha.toLocaleDateString('es-ES')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Peso</p>
                <p className="text-white font-medium">{lastRecord.Peso} kg</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Músculo</p>
                <p className="text-white font-medium">{lastRecord.MusculoKg} kg</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Grasa</p>
                <p className="text-white font-medium">{lastRecord.GrasaKg} kg ({lastRecord.GrasaPorc}%)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
