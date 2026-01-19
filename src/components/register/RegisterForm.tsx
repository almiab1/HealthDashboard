import React, { useState, useEffect } from 'react';
import { FileText, Edit, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { RegistroCorporal } from '../../utils/data';
import { toast } from 'sonner';
import { createRecord, updateRecord, type RecordInput } from '../../lib/database';

type TabType = 'manual' | 'csv';

interface FormData {
  date: string;
  weight: string;
  bmi: string;
  fatMassKg: string;
  fatMassPercent: string;
  fatFreeMass: string;
  muscleMass: string;
  totalBodyWaterKg: string;
  totalBodyWaterPercent: string;
  basalMetabolicRate: string;
  metabolicAge: string;
  visceralFat: string;
  boneMineralMass: string;
  phaseAngle: string;
  resistance: string;
  reactance: string;
}

interface RegisterFormProps {
  initialData?: RegistroCorporal;
  isEditing?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  initialData, 
  isEditing = false, 
  onCancel,
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [loading, setLoading] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    weight: '',
    bmi: '',
    fatMassKg: '',
    fatMassPercent: '',
    fatFreeMass: '',
    muscleMass: '',
    totalBodyWaterKg: '',
    totalBodyWaterPercent: '',
    basalMetabolicRate: '',
    metabolicAge: '',
    visceralFat: '',
    boneMineralMass: '',
    phaseAngle: '',
    resistance: '',
    reactance: ''
  });

  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        date: initialData.Fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        weight: initialData.Peso?.toString() || '',
        bmi: initialData.IMC?.toString() || '',
        fatMassKg: initialData.GrasaKg?.toString() || '',
        fatMassPercent: initialData.GrasaPorc?.toString() || '',
        fatFreeMass: initialData.MasaLibreKg?.toString() || '',
        muscleMass: initialData.MusculoKg?.toString() || '',
        totalBodyWaterKg: initialData.AguaKg?.toString() || '',
        totalBodyWaterPercent: initialData.AguaPorc?.toString() || '',
        basalMetabolicRate: initialData.MetabolismoBasal?.toString() || '',
        metabolicAge: initialData.EdadMetabolica?.toString() || '',
        visceralFat: initialData.GrasaVisceral?.toString() || '',
        boneMineralMass: initialData.MasaOsea?.toString() || '',
        phaseAngle: initialData.AnguloFase?.toString() || '',
        resistance: initialData.Resistencia?.toString() || '',
        reactance: initialData.Reactancia?.toString() || ''
      });
    }
  }, [initialData, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usar el wrapper de base de datos (funciona en web y desktop)
      const recordInput: RecordInput = formData;
      
      const result = isEditing && initialData?.id 
        ? await updateRecord(initialData.id, recordInput)
        : await createRecord(recordInput);

      if (result.success) {
        toast.success(isEditing ? 'Registro actualizado exitosamente' : 'Registro guardado exitosamente');
        
        if (!isEditing) {
          // Resetear formulario solo si no estamos editando
          setFormData({
            date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            weight: '',
            bmi: '',
            fatMassKg: '',
            fatMassPercent: '',
            fatFreeMass: '',
            muscleMass: '',
            totalBodyWaterKg: '',
            totalBodyWaterPercent: '',
            basalMetabolicRate: '',
            metabolicAge: '',
            visceralFat: '',
            boneMineralMass: '',
            phaseAngle: '',
            resistance: '',
            reactance: ''
          });
        }

        if (onSuccess) {
            // Small delay to allow toast to be seen before redirect/refresh if any
            setTimeout(() => {
                onSuccess();
            }, 500);
        } else {
            window.dispatchEvent(new CustomEvent('records-updated'));
        }

      } else {
        toast.error(result.error || 'Error al guardar el registro');
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parsear el CSV - Manejar saltos de línea universales
      let content = csvContent.trim();
      
      // Limpiar BOM si existe
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }

      const lines = content.split(/\r?\n/);
      if (lines.length === 0) {
        toast.error('El contenido CSV está vacío');
        setLoading(false);
        return;
      }

      // Detectar encabezado
      const headerKeywords = ['date', 'fecha', 'weight', 'peso', 'imc', 'bmi'];
      const firstLineLower = lines[0].toLowerCase();
      const hasHeader = headerKeywords.some(keyword => firstLineLower.includes(keyword));
      
      const startIndex = hasHeader ? 1 : 0;
      const dataLines = lines.slice(startIndex);
      let savedCount = 0;
      let errorCount = 0;

      console.log(`Procesando ${dataLines.length} líneas...`);

      for (const line of dataLines) {
        if (!line.trim()) continue;

        // Detectar delimitador
        const semicolonCount = (line.match(/;/g) || []).length;
        const commaCount = (line.match(/,/g) || []).length;
        const delimiter = semicolonCount > commaCount ? ';' : ',';

        let values: string[];
        
        if (delimiter === ';') {
            values = line.split(';').map(v => v.trim().replace(',', '.'));
        } else {
            values = line.split(',').map(v => v.trim());
        }
        
        // Validación básica de columnas
        if (values.length < 2) {
          console.warn('Línea ignorada (faltan columnas):', line);
          errorCount++;
          continue;
        }

        // Normalización de fecha
        let dateStr = values[0].replace(/"/g, '');
        
        // Convertir YYYY-MM-DD a DD/MM/YYYY si es necesario
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [y, m, d] = dateStr.split('-');
            dateStr = `${d}/${m}/${y}`;
        }
        
        // Validar formato final DD/MM/YYYY
        // Aceptamos D/M/YYYY también (ej: 1/1/2026)
        if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            console.warn(`Fecha inválida ignorada: ${dateStr} en línea: ${line}`);
            errorCount++;
            continue;
        }

        const recordData: RecordInput = {
          date: dateStr,
          weight: values[1],
          bmi: values[2] || '',
          fatMassKg: values[3] || '',
          fatMassPercent: values[4] || '',
          fatFreeMass: values[5] || '',
          muscleMass: values[6] || '',
          totalBodyWaterKg: values[7] || '',
          totalBodyWaterPercent: values[8] || '',
          basalMetabolicRate: values[9] || '',
          metabolicAge: values[10] || '',
          visceralFat: values[11] || '',
          boneMineralMass: values[12] || '',
          phaseAngle: values[13] || '',
          resistance: values[14] || '',
          reactance: values[15] || ''
        };

        console.log('Intentando guardar:', recordData);
        const result = await createRecord(recordData);

        if (!result.success) {
          console.error('Error guardando registro:', result.error, recordData);
          errorCount++;
        } else {
          savedCount++;
        }
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} registro(s) guardado(s) exitosamente. Ve al Historial para verlos.`, {
          duration: 5000,
        });
        if (errorCount > 0) {
            toast.warning(`Hubo ${errorCount} líneas que no se pudieron procesar.`);
        }
        setCsvContent('');
        
        // No redirigir - dejar que el usuario navegue manualmente para debug
        if (onSuccess) {
            onSuccess();
        }
        // Los datos ya están guardados en Tauri - navegar manualmente al historial
      } else if (errorCount > 0) {
        toast.error(`Error: No se guardaron registros. ${errorCount} líneas fallaron.`);
      } else {
        toast.info('No se encontraron datos válidos para guardar.');
      }

    } catch (error) {
      console.error('Error procesando CSV:', error);
      toast.error('Error interno al procesar el CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCancel) {
      onCancel();
    } else {
        // Default behavior: go to home if href is present (in component render)
        // or just do nothing if no href (but the anchor tag handles it)
        window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs - Only show if not editing */}
      {!isEditing && (
        <div className="flex gap-2 border-b border-[#1e3327] pb-2">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-[#1e3327] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Edit className="h-4 w-4" />
            Formulario Manual
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'csv'
                ? 'bg-[#1e3327] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            Importar CSV
          </button>
        </div>
      )}

      {/* Manual Form */}
      {(activeTab === 'manual' || isEditing) && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                placeholder="DD/MM/YYYY"
                required
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Peso */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Peso (kg) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="92.9"
                required
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* IMC */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IMC</label>
              <input
                type="number"
                step="0.1"
                name="bmi"
                value={formData.bmi}
                onChange={handleInputChange}
                placeholder="27.4"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Grasa Corporal (kg) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Grasa Corporal (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="fatMassKg"
                value={formData.fatMassKg}
                onChange={handleInputChange}
                placeholder="21.7"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Grasa Corporal (%) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Grasa Corporal (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="fatMassPercent"
                value={formData.fatMassPercent}
                onChange={handleInputChange}
                placeholder="23.4"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Masa Libre de Grasa */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Masa Libre de Grasa (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="fatFreeMass"
                value={formData.fatFreeMass}
                onChange={handleInputChange}
                placeholder="71.2"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Masa Muscular */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Masa Muscular (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="muscleMass"
                value={formData.muscleMass}
                onChange={handleInputChange}
                placeholder="67.7"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Agua Corporal (kg) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Agua Corporal (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="totalBodyWaterKg"
                value={formData.totalBodyWaterKg}
                onChange={handleInputChange}
                placeholder="50.1"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Agua Corporal (%) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Agua Corporal (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="totalBodyWaterPercent"
                value={formData.totalBodyWaterPercent}
                onChange={handleInputChange}
                placeholder="53.9"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Metabolismo Basal */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Metabolismo Basal (kcal)
              </label>
              <input
                type="number"
                name="basalMetabolicRate"
                value={formData.basalMetabolicRate}
                onChange={handleInputChange}
                placeholder="2126"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Edad Metabólica */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Edad Metabólica (años)
              </label>
              <input
                type="number"
                name="metabolicAge"
                value={formData.metabolicAge}
                onChange={handleInputChange}
                placeholder="40"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Grasa Visceral */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Grasa Visceral
              </label>
              <input
                type="number"
                name="visceralFat"
                value={formData.visceralFat}
                onChange={handleInputChange}
                placeholder="7"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Masa Ósea */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Masa Ósea (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="boneMineralMass"
                value={formData.boneMineralMass}
                onChange={handleInputChange}
                placeholder="3.5"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Ángulo de Fase */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ángulo de Fase (°)
              </label>
              <input
                type="number"
                step="0.1"
                name="phaseAngle"
                value={formData.phaseAngle}
                onChange={handleInputChange}
                placeholder="7.9"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Resistencia */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resistencia (Ω)
              </label>
              <input
                type="number"
                step="0.1"
                name="resistance"
                value={formData.resistance}
                onChange={handleInputChange}
                placeholder="551.8"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Reactancia */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reactancia (Ω)
              </label>
              <input
                type="number"
                step="0.1"
                name="reactance"
                value={formData.reactance}
                onChange={handleInputChange}
                placeholder="76.4"
                className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              type="button"
              className="px-6 py-2.5 bg-transparent border border-[#1e3327] text-gray-300 rounded-lg hover:bg-[#162119] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                isEditing ? 'Actualizar Registro' : 'Guardar Registro'
              )}
            </button>
          </div>
        </form>
      )}

      {/* CSV Import */}
      {activeTab === 'csv' && !isEditing && (
        <form onSubmit={handleCsvSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contenido CSV
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Puedes pegar el contenido del CSV o cargar un archivo. Formato esperado: Date,Weight (kg),BMI,Fat Mass (kg),...
            </p>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a1310] border-2 border-dashed border-[#1e3327] rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-400">Cargar archivo CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Text Area */}
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Date,Weight (kg),BMI,Fat Mass (kg),Fat Mass (%),...&#10;15/09/2025,96.6,28.5,23.5,24.3,..."
              rows={10}
              className="w-full px-3 py-2 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              type="button"
              className="px-6 py-2.5 bg-transparent border border-[#1e3327] text-gray-300 rounded-lg hover:bg-[#1e3327] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !csvContent.trim()}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                'Importar Registros'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
