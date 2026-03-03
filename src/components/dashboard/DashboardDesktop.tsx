import React, { useState, useEffect } from 'react';
import { Plus, Loader2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { DateFilter } from './DateFilter';
import { getAllRecords, getSetting } from '../../lib/database';
import type { RegistroCorporal } from '../../utils/data';
import { MetricTooltip } from '../ui/MetricTooltip';
import { EmptyState } from '../ui/EmptyState';
import { MetricCardSkeleton, RecentTableSkeleton } from '../ui/Skeleton';

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

// Helper functions for trend colors and icons
function getTrendColor(delta: number | undefined, inverse: boolean): string {
  if (!delta || delta === 0) return 'text-gray-500';
  const isGood = inverse ? delta < 0 : delta > 0;
  return isGood ? 'text-emerald-400' : 'text-red-400';
}

// Recent Table Component
interface RecentTableProps {
  lastRecord: RegistroCorporal;
  previousRecord: RegistroCorporal | null;
  delta: DataWithDelta['delta'] | null;
}

const RecentTableDesktop: React.FC<RecentTableProps> = ({ lastRecord, previousRecord, delta }) => {
  const allMetrics = [
    { id: 'Peso', label: 'Peso', value: lastRecord.Peso, prev: previousRecord?.Peso, delta: delta?.Peso, unit: 'kg', inverse: true },
    { id: 'IMC', label: 'IMC', value: lastRecord.IMC, prev: previousRecord?.IMC, delta: delta?.IMC, unit: '', inverse: true },
    { id: 'GrasaKg', label: 'Grasa', value: lastRecord.GrasaKg, prev: previousRecord?.GrasaKg, delta: delta?.GrasaKg, unit: 'kg', inverse: true },
    { id: 'GrasaPorc', label: '% Grasa', value: lastRecord.GrasaPorc, prev: previousRecord?.GrasaPorc, delta: delta?.GrasaPorc, unit: '%', inverse: true },
    { id: 'MusculoKg', label: 'Músculo', value: lastRecord.MusculoKg, prev: previousRecord?.MusculoKg, delta: delta?.MusculoKg, unit: 'kg', inverse: false },
    { id: 'AguaPorc', label: '% Agua', value: lastRecord.AguaPorc, prev: previousRecord?.AguaPorc, delta: delta?.AguaPorc, unit: '%', inverse: false },
    { id: 'MasaLibreKg', label: 'M. Libre Grasa', value: lastRecord.MasaLibreKg, prev: previousRecord?.MasaLibreKg, delta: delta?.MasaLibreKg, unit: 'kg', inverse: false },
    { id: 'MetabolismoBasal', label: 'Metab. Basal', value: lastRecord.MetabolismoBasal, prev: previousRecord?.MetabolismoBasal, delta: delta?.MetabolismoBasal, unit: 'kcal', inverse: false },
    { id: 'GrasaVisceral', label: 'G. Visceral', value: lastRecord.GrasaVisceral, prev: previousRecord?.GrasaVisceral, delta: delta?.GrasaVisceral, unit: '', inverse: true },
  ];

  const renderTrendIcon = (delta: number | undefined, small = false) => {
    if (!delta || delta === 0) return null;
    const size = small ? "h-3 w-3" : "h-4 w-4";
    return delta > 0 ? <TrendingUp className={size} /> : <TrendingDown className={size} />;
  };

  const formatDelta = (delta: number | undefined, unit: string) => {
    if (delta === undefined) return '-';
    const prefix = delta > 0 ? '+' : '';
    const unitStr = unit && unit !== '%' ? '' : unit;
    return `${prefix}${delta}${unitStr}`;
  };

  return (
    <div className="rounded-xl bg-[#111c16] border border-[#1e3327] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e3327]">
        <h2 className="text-sm font-semibold text-white">Último Registro</h2>
        <p className="text-xs text-gray-400">{lastRecord.Fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div>
        <table className="w-full">
          <thead className="bg-[#0d1712]">
            <tr className="border-b border-[#1e3327]">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Métrica</th>
              <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Actual</th>
              <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Anterior</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {allMetrics.map((metric, index) => {
              const trendColor = getTrendColor(metric.delta, metric.inverse);
              const isLast = index === allMetrics.length - 1;
              return (
                <tr key={metric.id} className={`hover:bg-[#162119] transition-colors ${!isLast ? 'border-b border-[#1e3327]' : ''}`}>
                  <td className="px-4 py-2.5 text-sm font-medium text-white whitespace-nowrap">{metric.label}</td>
                  <td className="px-3 py-2.5 text-sm text-white text-right whitespace-nowrap font-semibold">{metric.value}{metric.unit === '%' ? '%' : metric.unit ? ` ${metric.unit}` : ''}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-400 text-right">{metric.prev ?? '-'}</td>
                  <td className={`px-4 py-2.5 text-sm font-semibold text-right ${trendColor}`}>
                    <div className="flex items-center justify-end gap-1">
                      <span>{formatDelta(metric.delta, metric.unit)}</span>
                      {renderTrendIcon(metric.delta, false)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DashboardDesktop: React.FC = () => {
  const [data, setData] = useState<RegistroCorporal[]>([]);
  const [userName, setUserName] = useState<string>('Usuario');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[DashboardDesktop] Cargando datos...');
      const records = await getAllRecords();
      console.log('[DashboardDesktop] Registros obtenidos:', records.length);
      setData(records);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('[DashboardDesktop] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserName = async () => {
    try {
      const value = await getSetting('userName');
      if (value) {
        setUserName(value);
      }
    } catch (err) {
      console.error('[DashboardDesktop] Error al cargar nombre:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadUserName();
    
    // Recargar cuando se vuelve a esta página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[DashboardDesktop] Página visible, recargando datos...');
        loadData();
      }
    };
    
    const handleFocus = () => {
      console.log('[DashboardDesktop] Ventana enfocada, recargando datos...');
      loadData();
    };
    
    const handleRecordsUpdated = () => {
      console.log('[DashboardDesktop] Evento records-updated recibido');
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
      <div className="flex flex-col h-[calc(100vh-110px)] overflow-hidden">
        <div className="flex-shrink-0 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between mb-3">
          <div>
            <div className="h-8 w-48 animate-pulse rounded-md bg-[#1e3327]/60 mb-1" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-[#1e3327]/60" />
          </div>
        </div>
        <div className="flex-shrink-0 mb-3">
          <div className="h-4 w-48 animate-pulse rounded-md bg-[#1e3327]/60" />
        </div>
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex flex-col gap-2 order-2 md:order-1">
            <div className="flex-1 min-h-[100px]"><MetricCardSkeleton /></div>
            <div className="flex-1 min-h-[100px]"><MetricCardSkeleton /></div>
            <div className="flex-1 min-h-[100px]"><MetricCardSkeleton /></div>
          </div>
          <div className="w-full md:w-[33%] flex-shrink-0 order-1 md:order-2">
            <RecentTableSkeleton />
          </div>
        </div>
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
    <div className="flex flex-col h-[calc(100vh-110px)] overflow-hidden">
      {/* Header Section */}
      <div className="flex-shrink-0 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between mb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Hola, {userName}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Aquí puedes ver tu progreso semanal.</p>
        </div>
        <a 
          href="/register" 
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20 text-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar Nuevas Medidas
        </a>
      </div>

      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-white">Progreso a lo Largo del Tiempo</h2>
        <DateFilter />
      </div>

      {/* Main Content - Two Column Layout: Charts LEFT (wide), Table RIGHT (narrow) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3">
        {/* Left Column: Metrics with Charts - Takes most space */}
        <div className="flex-1 flex flex-col gap-2 order-2 md:order-1">
          {hasData && lastRecord ? (
            <>
              <div className="flex-1 min-h-[100px]">
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
              </div>
              <div className="flex-1 min-h-[100px]">
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
              </div>
              <div className="flex-1 min-h-[100px]">
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
              </div>
            </>
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-7 w-7 text-emerald-400" />}
              title="Sin registros todavia"
              description="Registra tu primera medicion corporal para comenzar a ver tu progreso aqui."
              ctaLabel="Registrar Nuevas Medidas"
              ctaHref="/register"
            />
          )}
        </div>

        {/* Right Column: Recent History Table - ~33% width */}
        {hasData && lastRecord && (
          <div className="w-full md:w-[33%] flex-shrink-0 order-1 md:order-2">
            <RecentTableDesktop lastRecord={lastRecord} previousRecord={previousRecord} delta={delta} />
          </div>
        )}
      </div>
    </div>
  );
};
