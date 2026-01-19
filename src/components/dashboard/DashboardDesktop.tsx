import React, { useState, useEffect } from 'react';
import { Plus, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { DateFilter } from './DateFilter';
import { getAllRecords } from '../../lib/database';
import type { RegistroCorporal } from '../../utils/data';
import { MetricTooltip } from '../ui/MetricTooltip';

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
  const simpleMetrics = [
    { id: 'Peso', label: 'Peso', description: 'Suma total de componentes del cuerpo.', value: lastRecord.Peso, prev: previousRecord?.Peso, delta: delta?.Peso, unit: 'kg', inverse: true },
    { id: 'IMC', label: 'IMC', description: 'Relación entre peso y altura (Peso / Altura²).', value: lastRecord.IMC, prev: previousRecord?.IMC, delta: delta?.IMC, unit: '', inverse: true },
  ];

  const combinedMetrics = [
    { 
      id: 'Grasa', 
      label: 'Grasa Corporal',
      description: 'Cantidad total de tejido adiposo en el cuerpo.',
      valueKg: lastRecord.GrasaKg, 
      valuePorc: lastRecord.GrasaPorc,
      prevKg: previousRecord?.GrasaKg, 
      prevPorc: previousRecord?.GrasaPorc,
      deltaKg: delta?.GrasaKg,
      deltaPorc: delta?.GrasaPorc,
      inverse: true 
    },
    { 
      id: 'Agua', 
      label: 'Agua Corporal',
      description: 'Cantidad de fluidos en el cuerpo.',
      valueKg: lastRecord.AguaKg, 
      valuePorc: lastRecord.AguaPorc,
      prevKg: previousRecord?.AguaKg, 
      prevPorc: previousRecord?.AguaPorc,
      deltaKg: delta?.AguaKg,
      deltaPorc: delta?.AguaPorc,
      inverse: false 
    },
  ];

  const otherMetrics = [
    { id: 'MasaLibreKg', label: 'Masa Libre de Grasa', description: 'Músculo + Hueso + Agua + Órganos.', value: lastRecord.MasaLibreKg, prev: previousRecord?.MasaLibreKg, delta: delta?.MasaLibreKg, unit: 'kg', inverse: false },
    { id: 'MusculoKg', label: 'Masa Muscular', description: 'Peso de músculos esqueléticos y lisos.', value: lastRecord.MusculoKg, prev: previousRecord?.MusculoKg, delta: delta?.MusculoKg, unit: 'kg', inverse: false },
    { id: 'MetabolismoBasal', label: 'Metabolismo Basal', description: 'Energía que tu cuerpo quema en reposo en 24h.', value: lastRecord.MetabolismoBasal, prev: previousRecord?.MetabolismoBasal, delta: delta?.MetabolismoBasal, unit: 'kcal', inverse: false },
    { id: 'EdadMetabolica', label: 'Edad Metabólica', description: 'Comparación de TMB con la media de tu edad.', value: lastRecord.EdadMetabolica, prev: previousRecord?.EdadMetabolica, delta: delta?.EdadMetabolica, unit: 'años', inverse: true },
    { id: 'GrasaVisceral', label: 'Grasa Visceral', description: 'Grasa que rodea órganos vitales en zona abdominal.', value: lastRecord.GrasaVisceral, prev: previousRecord?.GrasaVisceral, delta: delta?.GrasaVisceral, unit: '', inverse: true },
  ];

  const renderTrendIcon = (delta: number | undefined) => {
    if (!delta || delta === 0) return null;
    return delta > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const formatDelta = (delta: number | undefined, unit: string) => {
    if (delta === undefined) return '-';
    const prefix = delta > 0 ? '+' : '';
    const unitStr = unit && unit !== '%' ? ' ' + unit : unit;
    return `${prefix}${delta}${unitStr}`;
  };

  return (
    <div>
      <h2 className="text-sm sm:text-base font-semibold text-white mb-4 lg:mb-5">Último Registro</h2>
      <div className="rounded-xl bg-[#111c16] border border-[#1e3327] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-[#1e3327]">
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Métrica</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Último Valor</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Valor Anterior</th>
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {/* Simple metrics */}
              {simpleMetrics.map((metric) => {
                const trendColor = getTrendColor(metric.delta, metric.inverse);
                return (
                  <tr key={metric.id} className="hover:bg-[#162119] transition-colors border-b border-[#1e3327]">
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-medium text-white">
                      <div className="flex items-center">
                        {metric.label}
                        <MetricTooltip description={metric.description} />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm text-white">{metric.value} {metric.unit}</td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm text-gray-500">{metric.prev ?? '-'} {metric.unit}</td>
                    <td className={`px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-medium text-right ${trendColor}`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{formatDelta(metric.delta, metric.unit)}</span>
                        {renderTrendIcon(metric.delta)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Combined metrics (kg | %) */}
              {combinedMetrics.map((metric) => {
                const trendColorKg = getTrendColor(metric.deltaKg, metric.inverse);
                const trendColorPorc = getTrendColor(metric.deltaPorc, metric.inverse);
                return (
                  <tr key={metric.id} className="hover:bg-[#162119] transition-colors border-b border-[#1e3327]">
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-medium text-white">
                      <div className="flex items-center">
                        {metric.label}
                        <MetricTooltip description={metric.description} />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm text-white">
                      {metric.valueKg} kg <span className="text-gray-500 mx-1">|</span> {metric.valuePorc}%
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm text-gray-500">
                      {metric.prevKg ?? '-'} kg <span className="mx-1">|</span> {metric.prevPorc ?? '-'}%
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-medium text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={trendColorKg}>{formatDelta(metric.deltaKg, 'kg')}</span>
                        {renderTrendIcon(metric.deltaKg)}
                        <span className="text-gray-600 mx-0.5">|</span>
                        <span className={trendColorPorc}>{formatDelta(metric.deltaPorc, '%')}</span>
                        {renderTrendIcon(metric.deltaPorc)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Other simple metrics */}
              {otherMetrics.map((metric, index) => {
                const trendColor = getTrendColor(metric.delta, metric.inverse);
                const isLast = index === otherMetrics.length - 1;
                return (
                  <tr key={metric.id} className={`hover:bg-[#162119] transition-colors ${!isLast ? 'border-b border-[#1e3327]' : ''}`}>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-medium text-white">
                      <div className="flex items-center">
                        {metric.label}
                        <MetricTooltip description={metric.description} />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm text-white">{metric.value} {metric.unit}</td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm text-gray-500">{metric.prev ?? '-'} {metric.unit}</td>
                    <td className={`px-4 lg:px-6 py-4 lg:py-5 text-xs lg:text-sm font-medium text-right ${trendColor}`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{formatDelta(metric.delta, metric.unit)}</span>
                        {renderTrendIcon(metric.delta)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const DashboardDesktop: React.FC = () => {
  const [data, setData] = useState<RegistroCorporal[]>([]);
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

  useEffect(() => {
    loadData();
    
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

      {/* Recent History - Full table */}
      {hasData && lastRecord && (
        <RecentTableDesktop lastRecord={lastRecord} previousRecord={previousRecord} delta={delta} />
      )}
    </div>
  );
};
