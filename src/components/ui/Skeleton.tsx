import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#1e3327]/60 ${className}`}
    />
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl bg-[#111c16] border border-[#1e3327] p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-6" />
      </div>
      <div className="flex-1 w-full" style={{ minHeight: '50px' }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <tr className="border-b border-[#1e3327]">
      <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
      <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
    </tr>
  );
};

export const RecentTableSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl bg-[#111c16] border border-[#1e3327] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e3327]">
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="p-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e3327] last:border-0">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
};
