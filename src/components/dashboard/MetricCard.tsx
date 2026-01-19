import React, { useMemo, useId } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from 'recharts';
import { useDateFilterStore } from '../../stores/useDateFilterStore';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  delta?: number;
  inverseTrend?: boolean;
  data: any[];
  dataKey: string;
  color?: string;
}

const CustomTooltip = ({ active, payload, unit }: any) => {
    if (active && payload && payload.length) {
        const date = payload[0].payload.Fecha;
        const formattedDate = date instanceof Date 
            ? date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
            : 'Fecha';

        return (
            <div className="bg-[#1a2e22] border border-[#2a4035] rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs shadow-xl">
                <p className="font-medium text-gray-400 mb-0.5 sm:mb-1">{formattedDate}</p>
                <p className="text-white font-bold text-xs sm:text-sm">
                    {payload[0].value} {unit}
                </p>
            </div>
        );
    }
    return null;
};

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit = '', 
  delta, 
  inverseTrend = false, 
  data,
  dataKey,
  color = "#4ade80"
}) => {
  // Generate unique ID for gradient to avoid conflicts between cards
  const gradientId = useId();
  
  // Extract explicit dependencies for the filter memo
  const { range, customStartDate, customEndDate, getFilteredDateRange } = useDateFilterStore();

  const filteredData = useMemo(() => {
    // getFilteredDateRange depends on store state. We call it here.
    // By adding customStartDate/EndDate to the hook destructuring, we ensure re-renders when they change.
    const { start, end } = getFilteredDateRange();
    
    if (!start && !end) return data;

    return data.filter(item => {
      const itemDate = new Date(item.Fecha);
      
      if (start && end) {
        return itemDate >= start && itemDate <= end;
      }
      
      if (start && !end) return itemDate >= start;
      if (!start && end) return itemDate <= end;

      return true;
    });
  }, [data, range, customStartDate, customEndDate]); // Removed getFilteredDateRange from deps to avoid unstable reference issues 

  const { current, calculatedDelta } = useMemo(() => {
    if (filteredData.length === 0) return { current: value, calculatedDelta: delta };
    
    // El último registro dentro del rango filtrado
    const last = filteredData[filteredData.length - 1];
    
    // El primer registro dentro del rango filtrado (para calcular cambio en el periodo)
    const first = filteredData.length > 0 ? filteredData[0] : null;
    
    // Valor actual del último registro en el rango
    const currentVal = last[dataKey];
    
    // Calcular delta basado en el rango seleccionado
    let calcDelta = 0;
    if (first && first !== last) {
        const firstVal = first[dataKey];
        
        // Calcular diferencia absoluta: Final - Inicial
        calcDelta = currentVal - firstVal;
        calcDelta = Number(calcDelta.toFixed(1));
    }
    
    return { current: currentVal, calculatedDelta: calcDelta };
  }, [filteredData, dataKey, value, delta]);

  // Use calculated values if filtering is active and valid, otherwise fallback to props
  const displayValue = filteredData.length > 0 ? current : value;
  const displayDelta = filteredData.length > 1 ? calculatedDelta : (filteredData.length === 1 ? 0 : delta);


  let trendColor = 'text-gray-500';
  let TrendIcon = null;

  if (displayDelta !== undefined && displayDelta !== 0) {
      const isPositive = displayDelta > 0;
      const isGood = inverseTrend ? !isPositive : isPositive;
      trendColor = isGood ? 'text-emerald-400' : 'text-red-400';
      TrendIcon = isPositive ? ArrowUp : ArrowDown;
  }
  
  const getRangeLabel = () => {
    switch (range) {
      case '30d': return 'Últimos 30 días';
      case '3m': return 'Últimos 3 meses';
      case '6m': return 'Últimos 6 meses';
      case '1y': return 'Último año';
      case 'ytd': return 'Este año';
      case 'all': return 'Histórico';
      case 'custom': return 'Personalizado';
      default: return '';
    }
  };

  return (
    <div className="rounded-xl bg-[#111c16] border border-[#1e3327] p-4 sm:p-5 overflow-hidden">
      {/* Header */}
      <div className="mb-1">
        <p className="text-xs sm:text-sm text-gray-400 font-medium">{title}</p>
      </div>
      
      {/* Value */}
      <div className="mb-2 sm:mb-3">
        <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{displayValue}</span>
        <span className="text-lg sm:text-xl text-gray-400 ml-1">{unit}</span>
      </div>
      
      {/* Trend */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <span className="text-[10px] sm:text-xs text-gray-500">{getRangeLabel()}</span>
        {displayDelta !== undefined && displayDelta !== 0 && TrendIcon && (
          <span className={`text-[10px] sm:text-xs font-medium ${trendColor} flex items-center`}>
            <TrendIcon className="h-3 w-3 mr-0.5" />
            {Math.abs(displayDelta)} {unit}
          </span>
        )}
      </div>
      
      {/* Chart */}
      <div className="h-[80px] sm:h-[100px] w-full" style={{ minHeight: '80px' }}>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip 
                content={<CustomTooltip unit={unit} />} 
                cursor={{ stroke: '#3a5a45', strokeWidth: 1, strokeDasharray: '4 4' }} 
              />
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#${gradientId})`} 
                activeDot={{ r: 3, strokeWidth: 2, stroke: color, fill: '#111c16' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-xs">
            Sin datos en este periodo
          </div>
        )}
      </div>
      
      {/* X-axis labels (Simplified for now as they are static in original) */}
      <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-600 mt-2 px-1">
        <span>Inicio</span>
        <span>Fin</span>
      </div>
    </div>
  );
};
