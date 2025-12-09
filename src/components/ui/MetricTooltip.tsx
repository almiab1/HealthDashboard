import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface MetricTooltipProps {
  description: string;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({ description }) => {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button 
            className="inline-flex items-center justify-center text-gray-500 hover:text-emerald-400 transition-colors focus:outline-none ml-1.5 cursor-help" 
            type="button"
            aria-label="Más información"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 overflow-hidden rounded-md border border-[#2a4035] bg-[#1a2e22] px-3 py-2 text-xs text-gray-200 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-[250px] leading-relaxed"
            sideOffset={5}
          >
            {description}
            <Tooltip.Arrow className="fill-[#2a4035]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

