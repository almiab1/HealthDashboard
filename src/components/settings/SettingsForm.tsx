import React, { useState, useEffect } from 'react';
import { User, Save, Loader2, Check } from 'lucide-react';
import { getSetting, setSetting } from '../../lib/database';

export const SettingsForm: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el nombre actual al montar el componente
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const value = await getSetting('userName');
        if (value) {
          setUserName(value);
        }
      } catch (err) {
        console.error('Error al cargar configuración:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const result = await setSetting('userName', userName.trim() || 'Usuario');

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar');
      }

      setSaved(true);
      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Error al guardar la configuración');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        <span className="ml-2 text-gray-400 text-sm">Cargando...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-white mb-2">
            Nombre de Usuario
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full pl-10 pr-4 py-2.5 bg-[#0d1712] border border-[#1e3327] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            Este nombre se mostrará en el saludo del Dashboard
          </p>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-semibold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar
              </>
            )}
          </button>

          {saved && (
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              <Check className="h-4 w-4" />
              Guardado correctamente
            </span>
          )}
        </div>
      </div>
    </form>
  );
};
