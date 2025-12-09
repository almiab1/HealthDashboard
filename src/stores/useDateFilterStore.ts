import { create } from 'zustand';

export type DateRange = '30d' | '3m' | '6m' | '1y' | 'ytd' | 'all' | 'custom';

interface DateFilterState {
  range: DateRange;
  customStartDate: Date | null;
  customEndDate: Date | null;
  setRange: (range: DateRange) => void;
  setCustomDates: (start: Date | null, end: Date | null) => void;
  getFilteredDateRange: () => { start: Date | null; end: Date | null };
}

export const useDateFilterStore = create<DateFilterState>((set, get) => ({
  range: '30d',
  customStartDate: null,
  customEndDate: null,
  
  setRange: (range) => set({ range }),
  
  setCustomDates: (start, end) => set({ 
    customStartDate: start, 
    customEndDate: end,
    range: 'custom' 
  }),

  getFilteredDateRange: () => {
    const { range, customStartDate, customEndDate } = get();
    const now = new Date();
    // Reset time to end of day for consistency in comparisons
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    let start = new Date(now);
    // Reset time to start of day
    start.setHours(0, 0, 0, 0);

    switch (range) {
      case '30d':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 30);
        return { start, end };
      case '3m':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setMonth(start.getMonth() - 3);
        return { start, end };
      case '6m':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setMonth(start.getMonth() - 6);
        return { start, end };
      case '1y':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setFullYear(start.getFullYear() - 1);
        return { start, end };
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
        start.setHours(0, 0, 0, 0); // Explicitly ensure time is 00:00:00.000
        return { start, end };
      case 'all':
        return { start: null, end: null };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: null, end: null };
    }
  }
}));

