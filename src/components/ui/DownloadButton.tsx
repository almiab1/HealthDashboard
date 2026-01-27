import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import type { RegistroCorporal } from '../../utils/data';
import { convertRecordsToCSV, downloadCSV } from '../../utils/export';
import { toast } from 'sonner';

interface DownloadButtonProps {
  data: RegistroCorporal[];
  className?: string;
  label?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  data, 
  className = '',
  label = 'Exportar CSV'
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDownload = async () => {
    if (!data || data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    try {
      setIsDownloading(true);
      const csv = convertRecordsToCSV(data);
      const date = new Date().toISOString().split('T')[0];
      const filename = `nutritrack-datos-${date}.csv`;
      
      const filePath = await downloadCSV(csv, filename);
      
      // Check if we're in Tauri
      const isTauriEnv = typeof window !== 'undefined' && 
        Boolean((window as any).__TAURI__ || (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI_IPC__);
      
      if (filePath) {
        // Tauri - file was saved
        toast.success(`Archivo guardado en: ${filePath}`, { duration: 5000 });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else if (!isTauriEnv) {
        // Browser download completed
        toast.success(`Archivo descargado: ${filename}`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
      // If filePath is null in Tauri, user cancelled - no toast needed
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!data || data.length === 0 || isDownloading}
      className={`flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20 ${className}`}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showSuccess ? (
        <Check className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </button>
  );
};
