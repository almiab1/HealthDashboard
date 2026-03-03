import React, { useState, useEffect } from 'react';
import { useDateFilterStore, type DateRange } from '../../stores/useDateFilterStore';
import { Calendar, ChevronDown } from 'lucide-react';

export const DateFilter: React.FC = () => {
  const { range, setRange, setCustomDates, customStartDate, customEndDate } = useDateFilterStore();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Local state for inputs to avoid constant store updates while typing
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  // Update local state when store custom dates change
  useEffect(() => {
    if (customStartDate) setStartDateStr(customStartDate.toISOString().split('T')[0]);
    if (customEndDate) setEndDateStr(customEndDate.toISOString().split('T')[0]);
  }, [customStartDate, customEndDate]);

  const ranges: { label: string; value: DateRange }[] = [
    { label: '30 días', value: '30d' },
    { label: '3 meses', value: '3m' },
    { label: '6 meses', value: '6m' },
    { label: '1 año', value: '1y' },
    { label: 'YTD', value: 'ytd' },
    { label: 'Todo', value: 'all' },
    { label: 'Custom', value: 'custom' },
  ];

  const handleRangeClick = (value: DateRange) => {
    if (value === 'custom') {
      setShowCustomPicker(!showCustomPicker);
      setRange('custom');
    } else {
      setRange(value);
      setShowCustomPicker(false);
    }
  };

  const handleCustomDateApply = () => {
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      // Ensure start date is at beginning of day
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDateStr);
      // Ensure end date is at end of day to include all records for that day
      end.setHours(23, 59, 59, 999);

      setCustomDates(start, end);
      setShowCustomPicker(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center relative">
      <div className="flex bg-[#111c16] border border-[#1e3327] rounded-lg p-1 gap-1 overflow-x-auto scrollbar-hide">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => handleRangeClick(r.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              range === r.value
                ? 'bg-[#1e3327] text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#162119]'
            }`}
          >
            {r.value === 'custom' ? (
              <>
                <span className="hidden sm:inline">{r.label}</span>
                <Calendar className="sm:hidden h-3.5 w-3.5" />
              </>
            ) : r.label}
          </button>
        ))}
      </div>

      {showCustomPicker && (
        <div className="absolute z-10 mt-10 p-4 bg-[#111c16] border border-[#1e3327] rounded-lg shadow-xl flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Desde</label>
                <input 
                    type="date" 
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="bg-[#0a1310] border border-[#1e3327] rounded px-2 py-1 text-white text-sm"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Hasta</label>
                <input 
                    type="date" 
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="bg-[#0a1310] border border-[#1e3327] rounded px-2 py-1 text-white text-sm"
                />
            </div>
            <button 
                onClick={handleCustomDateApply}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-xs py-1.5 rounded transition-colors"
            >
                Aplicar
            </button>
        </div>
      )}
    </div>
  );
};

