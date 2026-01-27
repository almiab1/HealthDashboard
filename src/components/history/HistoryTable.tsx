import React, { useState, useMemo } from 'react';
import type { RegistroCorporal } from '../../utils/data';
import { RegisterForm } from '../register/RegisterForm';
import { Trash2, Edit, X, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, Square, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { deleteRecord } from '../../lib/database';
import { DownloadButton } from '../ui/DownloadButton';

interface HistoryTableProps {
  initialData: RegistroCorporal[];
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: keyof RegistroCorporal | null;
  direction: SortDirection;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ initialData }) => {
  // Ensure dates are Date objects (Astro serialization converts them to strings)
  const [data, setData] = useState<RegistroCorporal[]>(() => 
    initialData.map(d => ({
      ...d,
      Fecha: new Date(d.Fecha)
    }))
  );
  
  const [editingRecord, setEditingRecord] = useState<RegistroCorporal | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Fecha', direction: 'desc' });
  
  // Date range filter (same style as Dashboard)
  type DateRangeType = '30d' | '3m' | '6m' | '1y' | 'ytd' | 'all' | 'custom';
  const [selectedRange, setSelectedRange] = useState<DateRangeType>('all');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const handleSort = (key: keyof RegistroCorporal) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Calculate date range based on selection
  const getDateRange = (): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    let start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (selectedRange) {
      case '30d':
        start.setDate(start.getDate() - 30);
        return { start, end };
      case '3m':
        start.setMonth(start.getMonth() - 3);
        return { start, end };
      case '6m':
        start.setMonth(start.getMonth() - 6);
        return { start, end };
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        return { start, end };
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      case 'all':
        return { start: null, end: null };
      case 'custom':
        if (customStartDate && customEndDate) {
          const cStart = new Date(customStartDate);
          cStart.setHours(0, 0, 0, 0);
          const cEnd = new Date(customEndDate);
          cEnd.setHours(23, 59, 59, 999);
          return { start: cStart, end: cEnd };
        }
        return { start: null, end: null };
      default:
        return { start: null, end: null };
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];
    const { start, end } = getDateRange();

    // Filter by Date
    if (start) {
      result = result.filter(r => r.Fecha >= start);
    }
    if (end) {
      result = result.filter(r => r.Fecha <= end);
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortConfig.direction === 'asc' 
            ? aValue.getTime() - bValue.getTime() 
            : bValue.getTime() - aValue.getTime();
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return result;
  }, [data, sortConfig, selectedRange, customStartDate, customEndDate]);

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = processedData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedRange, customStartDate, customEndDate, sortConfig]);

  // Ensure current page is valid
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const confirmDelete = async () => {
    if (deleteConfirmationId === null) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteRecord(deleteConfirmationId);
      
      if (result.success) {
        setData(prev => prev.filter(r => r.id !== deleteConfirmationId));
        toast.success('Registro eliminado exitosamente');
      } else {
        toast.error(result.error || 'Error al eliminar el registro');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationId(null);
    }
  };

  // Multi-select handlers (only current page)
  const toggleSelectAll = () => {
    const currentPageIds = paginatedData.map(r => r.id);
    const allSelected = currentPageIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedIds);
      currentPageIds.forEach(id => newSelected.delete(id));
      setSelectedIds(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedIds);
      currentPageIds.forEach(id => newSelected.add(id));
      setSelectedIds(newSelected);
    }
  };
  
  const allOnPageSelected = paginatedData.length > 0 && paginatedData.every(r => selectedIds.has(r.id));

  const toggleSelectOne = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        const result = await deleteRecord(id);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    // Update local state
    setData(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setShowBulkDeleteConfirm(false);
    setIsDeleting(false);

    if (successCount > 0) {
      toast.success(`${successCount} registro(s) eliminado(s) exitosamente`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} registro(s) no se pudieron eliminar`);
    }
  };

  const handleEditSuccess = () => {
    window.location.reload();
  };

  const SortableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey: keyof RegistroCorporal, align?: 'left' | 'right' | 'center' }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th 
        className={`px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500 cursor-pointer hover:text-white transition-colors text-${align} group select-none`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {label}
          <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
            {isActive && sortConfig.direction === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : isActive && sortConfig.direction === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Historial de Mediciones</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Consulta y gestiona todos tus registros</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <DownloadButton data={data} label="Exportar CSV" />
          <a 
            href="/register" 
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-5 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="mr-2 h-5 w-5" />
            Registrar Nuevas Medidas
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-[#111c16] border border-[#1e3327] p-4 rounded-xl flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
        {/* Date Range Buttons */}
        <div className="relative flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex bg-[#0a1310] border border-[#1e3327] rounded-lg p-1 gap-1 flex-wrap">
            {([
              { label: '30 días', value: '30d' },
              { label: '3 meses', value: '3m' },
              { label: '6 meses', value: '6m' },
              { label: '1 año', value: '1y' },
              { label: 'YTD', value: 'ytd' },
              { label: 'Todo', value: 'all' },
              { label: 'Custom', value: 'custom' },
            ] as { label: string; value: DateRangeType }[]).map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  if (r.value === 'custom') {
                    setShowCustomPicker(!showCustomPicker);
                    setSelectedRange('custom');
                  } else {
                    setSelectedRange(r.value);
                    setShowCustomPicker(false);
                  }
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  selectedRange === r.value
                    ? 'bg-[#1e3327] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#162119]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Custom Date Picker Dropdown */}
          {showCustomPicker && (
            <div className="absolute top-full left-0 z-20 mt-2 p-4 bg-[#111c16] border border-[#1e3327] rounded-lg shadow-xl flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Desde</label>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-[#0a1310] border border-[#1e3327] rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Hasta</label>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-[#0a1310] border border-[#1e3327] rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                onClick={() => setShowCustomPicker(false)}
                disabled={!customStartDate || !customEndDate}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-xs py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>

        {/* Bulk Delete & Count */}
        <div className="ml-auto flex items-center gap-4">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar {selectedIds.size}
            </button>
          )}
          <span className="text-xs text-gray-500">
            {processedData.length} de {data.length} registros
          </span>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Histórico Completo</h2>
          {paginatedData.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {allOnPageSelected ? (
                <>
                  <CheckSquare className="h-4 w-4 text-emerald-500" />
                  Deseleccionar
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Seleccionar página
                </>
              )}
            </button>
          )}
        </div>
        {paginatedData.map((record) => {
          const isSelected = selectedIds.has(record.id);
          return (
          <div key={record.id} className={`rounded-xl bg-[#111c16] border border-[#1e3327] p-4 ${isSelected ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}>
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#1e3327]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSelectOne(record.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <span className="text-sm font-semibold text-white">
                  {record.Fecha.toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  record.AnguloFase < 5 
                    ? 'bg-red-500/20 text-red-400' 
                    : (record.AnguloFase > 7 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400')
                }`}>
                  Fase: {record.AnguloFase}
                </span>
                <div className="flex gap-1 ml-2">
                  <button 
                    onClick={() => setEditingRecord(record)}
                    className="p-1.5 rounded-lg hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmationId(record.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Peso</p>
                <p className="text-white font-medium">{record.Peso} kg</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Músculo</p>
                <p className="text-white font-medium">{record.MusculoKg} kg</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Grasa</p>
                <p className="text-white font-medium">{record.GrasaKg} kg ({record.GrasaPorc}%)</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Agua</p>
                <p className="text-white font-medium">{record.AguaPorc}%</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">IMC</p>
                <p className="text-white font-medium">{record.IMC}</p>
              </div>
            </div>
          </div>
        )})}
        {paginatedData.length === 0 && (
          <div className="text-center py-8 bg-[#111c16] border border-[#1e3327] rounded-xl">
            <p className="text-sm text-gray-500">No hay registros que coincidan con los filtros.</p>
          </div>
        )}
        
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 bg-[#111c16] border border-[#1e3327] rounded-xl p-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-400">
              {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:flex sm:flex-col rounded-xl bg-[#111c16] border border-[#1e3327] overflow-hidden" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <div className="flex-shrink-0 p-4 lg:p-6 border-b border-[#1e3327]">
          <h2 className="text-lg lg:text-xl font-bold text-white">Histórico Completo</h2>
        </div>
        
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full min-w-[700px]">
            <thead className="sticky top-0 bg-[#111c16] z-10">
              <tr className="border-b border-[#1e3327]">
                <th className="px-4 lg:px-6 py-3 lg:py-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-white transition-colors"
                    title={allOnPageSelected ? "Deseleccionar página" : "Seleccionar página"}
                  >
                    {allOnPageSelected ? (
                      <CheckSquare className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <SortableHeader label="Fecha" sortKey="Fecha" />
                <SortableHeader label="Peso" sortKey="Peso" />
                <SortableHeader label="Músculo" sortKey="MusculoKg" />
                <SortableHeader label="Grasa" sortKey="GrasaKg" />
                <SortableHeader label="% Grasa" sortKey="GrasaPorc" />
                <SortableHeader label="% Agua" sortKey="AguaPorc" />
                <SortableHeader label="Fase" sortKey="AnguloFase" />
                <SortableHeader label="IMC" sortKey="IMC" />
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record, index) => {
                const isLast = index === paginatedData.length - 1;
                const isSelected = selectedIds.has(record.id);
                return (
                  <tr key={record.id} className={`hover:bg-[#162119] transition-colors ${!isLast ? 'border-b border-[#1e3327]' : ''} ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <button
                        onClick={() => toggleSelectOne(record.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-white">
                      {record.Fecha.toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-white">{record.Peso}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-white">{record.MusculoKg}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-white">{record.GrasaKg}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-white">{record.GrasaPorc}%</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-white">{record.AguaPorc}%</td>
                    <td className={`px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium ${
                      record.AnguloFase < 5 
                        ? 'text-red-400' 
                        : (record.AnguloFase > 7 ? 'text-emerald-400' : 'text-white')
                    }`}>
                      {record.AnguloFase}
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-white">{record.IMC}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingRecord(record)}
                          className="p-1.5 rounded-lg hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmationId(record.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                 <tr>
                   <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                     No hay registros que coincidan con los filtros.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Desktop Pagination - Always visible */}
        <div className="flex-shrink-0 px-4 lg:px-6 py-3 border-t border-[#1e3327] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d1712]">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">Filas por página</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#0a1310] border border-[#1e3327] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 cursor-pointer appearance-none hover:border-[#2a4a3a] transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '28px'
              }}
            >
              <option value={5} className="bg-[#0a1310]">5</option>
              <option value={8} className="bg-[#0a1310]">8</option>
              <option value={10} className="bg-[#0a1310]">10</option>
              <option value={15} className="bg-[#0a1310]">15</option>
              <option value={25} className="bg-[#0a1310]">25</option>
            </select>
            <div className="h-4 w-px bg-[#1e3327]" />
            <span className="text-xs text-gray-400">
              <span className="text-white font-medium">{startIndex + 1}-{Math.min(endIndex, processedData.length)}</span> de <span className="text-white font-medium">{processedData.length}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-1 bg-[#0a1310] border border-[#1e3327] rounded-lg p-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="px-3 py-1 text-xs text-gray-400 min-w-[60px] text-center">
              <span className="text-white font-medium">{currentPage}</span> / {totalPages || 1}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-md hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-md hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setEditingRecord(null)} 
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111c16] border border-[#1e3327] rounded-xl shadow-2xl p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEditingRecord(null)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#1e3327] text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Editar Registro</h2>
              <p className="text-sm text-gray-500">Actualiza los valores de la medición.</p>
            </div>

            <RegisterForm 
              initialData={editingRecord} 
              isEditing={true}
              onCancel={() => setEditingRecord(null)}
              onSuccess={handleEditSuccess}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Single) */}
      {deleteConfirmationId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => !isDeleting && setDeleteConfirmationId(null)} 
          />
          <div className="relative w-full max-w-md bg-[#111c16] border border-[#1e3327] rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">¿Eliminar registro?</h3>
              <p className="text-sm text-gray-400">
                Esta acción no se puede deshacer. El registro será eliminado permanentemente de la base de datos.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-transparent border border-[#1e3327] text-gray-300 rounded-lg hover:bg-[#162119] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => !isDeleting && setShowBulkDeleteConfirm(false)} 
          />
          <div className="relative w-full max-w-md bg-[#111c16] border border-[#1e3327] rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">¿Eliminar {selectedIds.size} registros?</h3>
              <p className="text-sm text-gray-400">
                Esta acción no se puede deshacer. Los {selectedIds.size} registros seleccionados serán eliminados permanentemente de la base de datos.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-transparent border border-[#1e3327] text-gray-300 rounded-lg hover:bg-[#162119] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Eliminando...' : `Sí, eliminar ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
