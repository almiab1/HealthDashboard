import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SettingsForm } from './SettingsForm';
import { DownloadButton } from '../ui/DownloadButton';
import { getAllRecords } from '../../lib/database';
import type { RegistroCorporal } from '../../utils/data';

export const SettingsDesktop: React.FC = () => {
  const [data, setData] = useState<RegistroCorporal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const records = await getAllRecords();
        setData(records);
      } catch (err) {
        console.error('[SettingsDesktop] Error loading records:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalRecords = data.length;
  const firstRecordDate = totalRecords > 0 ? data[0].Fecha.toLocaleDateString('es-ES') : '-';
  const lastRecordDate = totalRecords > 0 ? data[data.length - 1].Fecha.toLocaleDateString('es-ES') : '-';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Configuración</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Administra tus datos y preferencias</p>
      </div>

      {/* Profile Settings Card */}
      <div className="bg-[#111c16] border border-[#1e3327] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#1e3327]">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <svg className="h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Perfil</h2>
              <p className="text-sm text-gray-500">Personaliza tu experiencia</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <SettingsForm />
        </div>
      </div>

      {/* Data Management Card */}
      <div className="bg-[#111c16] border border-[#1e3327] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#1e3327]">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <svg className="h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                <path d="M3 12A9 3 0 0 0 21 12"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Gestión de Datos</h2>
              <p className="text-sm text-gray-500">Exporta tus registros de mediciones corporales</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <span className="ml-2 text-gray-400 text-sm">Cargando datos...</span>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#0d1712] border border-[#1e3327] rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Registros</p>
                  <p className="text-2xl font-bold text-white">{totalRecords}</p>
                </div>
                <div className="bg-[#0d1712] border border-[#1e3327] rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Primer Registro</p>
                  <p className="text-lg font-semibold text-white">{firstRecordDate}</p>
                </div>
                <div className="bg-[#0d1712] border border-[#1e3327] rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Último Registro</p>
                  <p className="text-lg font-semibold text-white">{lastRecordDate}</p>
                </div>
              </div>

              {/* Export Section */}
              <div className="border-t border-[#1e3327] pt-6">
                <h3 className="text-sm font-medium text-white mb-3">Exportar Datos</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Descarga todos tus registros en formato CSV para usar en hojas de cálculo como Excel o Google Sheets.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <DownloadButton
                    data={data}
                    label="Descargar CSV"
                  />
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <svg className="h-4 w-4 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" x2="2" y1="12" y2="12"></line>
                      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                      <line x1="6" x2="6.01" y1="16" y2="16"></line>
                      <line x1="10" x2="10.01" y1="16" y2="16"></line>
                    </svg>
                    <span>El archivo incluirá todas las métricas: peso, IMC, masa muscular, grasa corporal, agua corporal, y más.</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
