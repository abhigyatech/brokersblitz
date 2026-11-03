import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-white dark:bg-[#1A1816] border-r border-[#1A1A1A]/10 dark:border-white/10 p-4 space-y-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#DF6400]/20 animate-pulse" />
          <div className="h-5 w-28 bg-[#1A1A1A]/15 dark:bg-white/15 rounded-md animate-pulse" />
        </div>
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-[#1A1A1A]/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-[#1A1A1A]/20 dark:bg-white/20 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-[#DF6400]/20 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1E1B17] p-5 rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-[#1A1A1A]/10 dark:bg-white/10 rounded" />
                <div className="w-7 h-7 rounded-lg bg-[#DF6400]/15" />
              </div>
              <div className="h-7 w-24 bg-[#1A1A1A]/20 dark:bg-white/20 rounded" />
              <div className="h-3 w-32 bg-emerald-500/20 rounded" />
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 p-6 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 bg-[#1A1A1A]/15 dark:bg-white/15 rounded" />
            <div className="h-8 w-24 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-[#F4F0EA] dark:bg-[#141210]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

