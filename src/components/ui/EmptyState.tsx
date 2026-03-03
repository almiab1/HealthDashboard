import React from 'react';
import { ClipboardList, BarChart3, Search } from 'lucide-react';

const iconMap = {
  chart: BarChart3,
  search: Search,
  clipboard: ClipboardList,
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  iconName?: keyof typeof iconMap;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconName,
  title,
  description,
  ctaLabel,
  ctaHref,
}) => {
  const IconComponent = iconName ? iconMap[iconName] : null;
  const renderedIcon = icon || (IconComponent ? <IconComponent className="h-7 w-7 text-emerald-400" /> : <ClipboardList className="h-7 w-7 text-emerald-400" />);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-[#111c16] border border-[#1e3327] rounded-xl p-8 sm:p-12">
      <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
        {renderedIcon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      {ctaLabel && ctaHref && (
        <a
          href={ctaHref}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 text-sm"
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
};
