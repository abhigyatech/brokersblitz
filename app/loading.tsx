import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-14 w-full bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 p-3 flex items-center justify-between animate-pulse">
          <div className="h-8 w-32 bg-[#DF6400]/20 rounded-xl" />
          <div className="h-8 w-64 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl hidden sm:block" />
          <div className="h-8 w-24 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl" />
        </div>

        <div className="h-72 sm:h-96 w-full bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 p-8 flex flex-col items-center justify-center space-y-4 animate-pulse">
          <div className="h-6 w-44 bg-[#DF6400]/20 rounded-full" />
          <div className="h-10 w-3/4 max-w-xl bg-[#1A1A1A]/20 dark:bg-white/20 rounded-xl" />
          <div className="h-12 w-full max-w-2xl bg-[#1A1A1A]/10 dark:bg-white/10 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 p-4 space-y-3 animate-pulse"
            >
              <div className="h-44 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl" />
              <div className="h-5 w-3/4 bg-[#1A1A1A]/15 dark:bg-white/15 rounded" />
              <div className="h-4 w-1/2 bg-[#DF6400]/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

