import React from 'react';

export default function BrokerStoreSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white">
      <div className="w-full h-44 sm:h-64 bg-[#1A1A1A]/10 dark:bg-white/10 animate-pulse" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
        <div className="bg-white dark:bg-[#1E1B17] rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1A1A1A]/15 dark:bg-white/15 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-[#1A1A1A]/15 dark:bg-white/15 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-[#DF6400]/20 rounded-md animate-pulse" />
                <div className="h-3 w-40 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 bg-[#DF6400]/15 rounded-xl animate-pulse" />
              <div className="h-10 w-28 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#1A1A1A]/10 dark:border-white/10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-[#F4F0EA] dark:bg-[#141210] rounded-xl space-y-1.5 animate-pulse">
                <div className="h-3 w-16 bg-[#1A1A1A]/10 dark:bg-white/10 rounded" />
                <div className="h-5 w-20 bg-[#DF6400]/20 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="h-6 w-44 bg-[#1A1A1A]/15 dark:bg-white/15 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-[#1A1A1A]/10 dark:bg-white/10" />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 w-28 bg-[#DF6400]/20 rounded" />
                  <div className="h-4 w-full bg-[#1A1A1A]/15 dark:bg-white/15 rounded" />
                  <div className="h-3 w-1/2 bg-[#1A1A1A]/10 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

