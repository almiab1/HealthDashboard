import React, { useState, useMemo } from "react";
import {
  Scale,
  Activity,
  Droplets,
  Bone,
  Zap,
  Heart,
  TrendingUp,
  Dumbbell,
  Ruler,
  ChevronDown,
  Search,
  ChevronsUpDown,
} from "lucide-react";

interface MetricPoint {
  type: "good" | "bad" | "alert";
  text: string;
}

interface MetricData {
  title: string;
  icon: React.FC<{ className?: string }>;
  whatIs: string;
  interpretation: string;
  points?: MetricPoint[];
  details?: string[];
}

const metrics: MetricData[] = [
  {
    title: "1. Peso (kg)",
    icon: Scale,
    whatIs:
      "La suma total de todos los componentes de tu cuerpo (huesos, musculos, grasa, agua, organos, etc.).",
    interpretation:
      "Por si solo, el peso es un indicador pobre de salud. Bajar de peso no siempre es bueno (si pierdes musculo) y subir no siempre es malo (si ganas musculo).",
    points: [
      { type: "good", text: "Si el peso baja a expensas de la grasa." },
      {
        type: "bad",
        text: "Si el peso baja a expensas del musculo o agua (deshidratacion).",
      },
    ],
  },
  {
    title: "2. Masa Grasa (kg y %)",
    icon: Activity,
    whatIs: "La cantidad total de tejido adiposo en el cuerpo.",
    interpretation: "Es el indicador mas importante para la salud metabolica.",
    details: [
      "Rango Saludable (Hombres 20-39 anos): 8% - 20%.",
      "Sobrepeso/Obesidad: Por encima del 20-25%.",
      "Tu estado: Actualmente estas rondando el 23-24%. Estas en un proceso de descenso, acercandote al rango saludable. Bajar este porcentaje es el objetivo principal.",
    ],
  },
  {
    title: "3. Masa Muscular (kg)",
    icon: Dumbbell,
    whatIs:
      "El peso de tus musculos esqueleticos (los que usas para moverte) y lisos (corazon, sistema digestivo), incluyendo el agua que contienen.",
    interpretation:
      "El motor de tu cuerpo. El musculo quema calorias incluso en reposo.",
    points: [
      {
        type: "good",
        text: "Mantener o aumentar este valor. Perder peso sin perder musculo es el exito de una dieta.",
      },
      {
        type: "alert",
        text: "Si este valor baja drasticamente, tu metabolismo se ralentizara y sera mas facil sufrir el 'efecto rebote'.",
      },
    ],
  },
  {
    title: "4. Masa Libre de Grasa (kg)",
    icon: Activity,
    whatIs: "Todo lo que no es grasa: Musculo + Hueso + Agua + Organos.",
    interpretation:
      "Es un indicador de tu constitucion 'util'. Cuanto mas alto sea este numero en relacion a tu peso total, mas fuerte y saludable es tu metabolismo.",
  },
  {
    title: "5. Agua Corporal Total (kg y %)",
    icon: Droplets,
    whatIs: "La cantidad de fluidos en tu cuerpo.",
    interpretation:
      "Estar bien hidratado ayuda a metabolizar la grasa y construir musculo.",
    details: [
      "Rango Saludable (Hombres): 50% - 65%.",
      "Tus valores estan alrededor del 53%, lo cual es correcto/normal.",
      "Si bajara del 50%, indicarias deshidratacion o retencion de liquidos.",
    ],
  },
  {
    title: "6. Mineral Oseo (kg)",
    icon: Bone,
    whatIs: "El peso de los minerales oseos (calcio, etc.) en tu estructura.",
    interpretation: "Indica la fortaleza de tus huesos.",
    details: [
      "Referencia: Para tu peso, un valor en torno a 3.2 - 3.6 kg es normal.",
      "Tu estado: Tienes 3.5 - 3.6 kg, lo que indica una buena densidad osea. El ejercicio de fuerza ayuda a mantener esto alto.",
    ],
  },
  {
    title: "7. Proteinas (kg)",
    icon: Dumbbell,
    whatIs:
      "La cantidad de proteina almacenada en el cuerpo (principalmente en los musculos).",
    interpretation:
      "Un nivel adecuado indica una buena nutricion y masa muscular sana.",
    points: [
      {
        type: "good",
        text: "Un nivel adecuado indica una buena nutricion y masa muscular sana.",
      },
      {
        type: "bad",
        text: "Un nivel bajo podria indicar desnutricion o falta de ingesta proteica. Tus niveles (~17.5 kg) son saludables y acordes a tu masa muscular.",
      },
    ],
  },
  {
    title: "8. IMC (Indice de Masa Corporal)",
    icon: Ruler,
    whatIs: "Una relacion simple entre peso y altura (Peso / Altura\u00B2).",
    interpretation:
      "< 18.5: Bajo peso | 18.5 - 24.9: Peso normal | 25.0 - 29.9: Sobrepeso | > 30.0: Obesidad.",
    details: [
      "Limitacion: El IMC no distingue entre grasa y musculo.",
      "Un culturista puede tener un IMC de 'obesidad' sin tener grasa. En tu caso, al tener buena musculatura, el IMC puede salir 'Sobrepeso' (27.4), pero es mas importante mirar el % de Grasa.",
    ],
  },
  {
    title: "9. Grasa Visceral (Indice)",
    icon: Heart,
    whatIs:
      "La grasa que rodea los organos vitales en la zona abdominal. Es la grasa 'peligrosa' asociada a diabetes, hipertension y problemas cardiacos.",
    interpretation: "Escala 1-59. 1-12 es Saludable. 13-59 es Excesivo.",
    details: [
      "Tu estado: Tienes un indice de 7. Esto es excelente.",
      "Indica que, aunque tengas algo de grasa corporal extra (subcutanea), tus organos estan sanos y libres de grasa peligrosa.",
    ],
  },
  {
    title: "10. Edad Metabolica",
    icon: Activity,
    whatIs:
      "Compara tu Tasa Metabolica Basal con la media de tu grupo de edad.",
    interpretation:
      "Si es menor o igual a tu edad real es bueno. Si es mayor, indica metabolismo lento.",
    details: [
      "Tu estado: Ha bajado a 40 anos (tienes 26). Esto indica que hay margen de mejora.",
      "Al ganar musculo y perder grasa, esta 'edad' bajara y se acercara a la tuya real.",
    ],
  },
  {
    title: "11. Metabolismo Basal (kcal)",
    icon: Zap,
    whatIs:
      "La energia (calorias) que tu cuerpo quema solo por estar vivo en 24 horas, sin contar ejercicio.",
    interpretation:
      "Cuanto mas alto, mejor: Significa que tienes un motor potente que quema grasa facilmente.",
    details: [
      "Relacion con el musculo: El musculo consume muchas calorias. Si ganas musculo, este numero sube.",
      "Tus ~2100 kcal son un numero bastante alto y bueno, gracias a tu altura y estructura.",
    ],
  },
  {
    title: "12. Angulo de Fase (\u00B0)",
    icon: TrendingUp,
    whatIs:
      "Un indicador de la salud celular y la integridad de la membrana celular. Es como una 'nota de calidad' de tus tejidos.",
    interpretation:
      "Bajo (< 5\u00B0): Desnutricion/Inflamacion. Normal (5\u00B0 - 7\u00B0): Estandar. Alto (> 7\u00B0): Celulas muy sanas.",
    details: [
      "Tu estado: Tienes 7.9\u00B0. Este es un valor extraordinario.",
      "Indica que, a nivel celular, tu cuerpo esta muy fuerte y nutrido. Es tu mejor indicador de salud estructural.",
    ],
  },
];

export const GuideCards: React.FC = () => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMetrics = useMemo(() => {
    if (!searchQuery.trim()) return metrics;
    const q = searchQuery.toLowerCase();
    return metrics.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.whatIs.toLowerCase().includes(q) ||
        m.interpretation.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const toggleCard = (index: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const allExpanded =
    filteredMetrics.length > 0 &&
    filteredMetrics.every((_, i) =>
      expandedIds.has(metrics.indexOf(filteredMetrics[i])),
    );

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(metrics.map((_, i) => i)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar metrica..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a1310] border border-[#1e3327] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors text-sm"
          />
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#111c16] border border-[#1e3327] rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#162119] transition-colors whitespace-nowrap"
        >
          <ChevronsUpDown className="h-4 w-4" />
          {allExpanded ? "Colapsar Todo" : "Expandir Todo"}
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredMetrics.map((metric) => {
          const globalIndex = metrics.indexOf(metric);
          const isExpanded = expandedIds.has(globalIndex);
          const Icon = metric.icon;

          return (
            <div
              key={metric.title}
              className="bg-[#111c16] border border-[#1e3327] rounded-xl overflow-hidden hover:border-emerald-500/30 transition-colors"
            >
              {/* Header - always visible, clickable */}
              <button
                onClick={() => toggleCard(globalIndex)}
                className="flex items-center gap-3 w-full px-5 py-4 text-left"
              >
                <div className="bg-[#1a2e22] p-2.5 rounded-lg flex-shrink-0">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white flex-1">
                  {metric.title}
                </h3>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {/* Content - collapsible */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Que es?
                    </span>
                    <p className="text-gray-300 text-sm leading-relaxed mt-1">
                      {metric.whatIs}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Interpretacion
                    </span>
                    <p className="text-gray-300 text-sm leading-relaxed mt-1">
                      {metric.interpretation}
                    </p>
                  </div>

                  {(metric.points || metric.details) && (
                    <div className="bg-[#0d1a12] rounded-lg p-3 space-y-2 border border-[#1e3327]">
                      {metric.points?.map((point, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span
                            className={
                              point.type === "good"
                                ? "text-emerald-400 font-bold"
                                : point.type === "bad"
                                  ? "text-red-400 font-bold"
                                  : "text-yellow-400 font-bold"
                            }
                          >
                            {point.type === "good"
                              ? "Bueno:"
                              : point.type === "bad"
                                ? "Malo:"
                                : "Alerta:"}
                          </span>
                          <span className="text-gray-400">{point.text}</span>
                        </div>
                      ))}
                      {metric.details?.map((detail, i) => (
                        <p key={i} className="text-sm text-gray-400">
                          {detail}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMetrics.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No se encontraron metricas que coincidan con "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
};
