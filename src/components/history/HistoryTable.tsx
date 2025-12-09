import React, { useState } from 'react';
import type { RegistroCorporal } from '../../utils/data';
import { RegisterForm } from '../register/RegisterForm';
import { Trash2, Edit, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryTableProps {
  initialData: RegistroCorporal[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ initialData }) => {
  // Ensure dates are Date objects (Astro serialization converts them to strings)
  const [data, setData] = useState<RegistroCorporal[]>(() => 
    initialData.map(d => ({
      ...d,
      Fecha: new Date(d.Fecha)
    })).sort((a, b) => b.Fecha.getTime() - a.Fecha.getTime())
  );
  
  const [editingRecord, setEditingRecord] = useState<RegistroCorporal | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (deleteConfirmationId === null) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/records/${deleteConfirmationId}`, { 
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setData(prev => prev.filter(r => r.id !== deleteConfirmationId));
        toast.success('Registro eliminado exitosamente');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al eliminar el registro');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationId(null);
    }
  };

  const handleEditSuccess = () => {
    // Reload to get fresh data
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        <h2 className="text-lg font-bold text-white mb-4">Histórico Completo</h2>
        {data.map((record) => (
          <div key={record.id} className="rounded-xl bg-[#111c16] border border-[#1e3327] p-4">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#1e3327]">
              <span className="text-sm font-semibold text-white">
                {record.Fecha.toLocaleDateString('es-ES')}
              </span>
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
        ))}
        {data.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No hay registros disponibles.</p>
        )}
        <p className="text-xs text-gray-500 text-center pt-2">Registro completo de mediciones corporales.</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl bg-[#111c16] border border-[#1e3327] overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-[#1e3327]">
          <h2 className="text-lg lg:text-xl font-bold text-white">Histórico Completo</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1e3327]">
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Peso</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Músculo</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Grasa</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">% Grasa</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">% Agua</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Fase</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">IMC</th>
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record, index) => {
                const isLast = index === data.length - 1;
                return (
                  <tr key={record.id} className={`hover:bg-[#162119] transition-colors ${!isLast ? 'border-b border-[#1e3327]' : ''}`}>
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
              {data.length === 0 && (
                 <tr>
                   <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                     No hay registros disponibles.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 lg:p-4 border-t border-[#1e3327]">
          <p className="text-[10px] lg:text-xs text-gray-500 text-center">Registro completo de mediciones corporales.</p>
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

      {/* Delete Confirmation Modal */}
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
    </>
  );
};
