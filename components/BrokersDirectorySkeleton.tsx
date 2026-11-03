import React from 'react';

export default function BrokersDirectorySkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white">
      <div className="border-b border-[#1A1A1A]/10 dark:border-white/10 bg-white/70 dark:bg-[#1A1816]/70 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="h-6 w-56 bg-[#DF6400]/20 rounded-full mx-auto animate-pulse" />
          <div className="h-10 w-96 max-w-full bg-[#1A1A1A]/15 dark:bg-white/15 rounded-xl mx-auto animate-pulse" />
          <div className="h-4 w-3/4 max-w-xl bg-[#1A1A1A]/10 dark:bg-white/10 rounded-md mx-auto animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-[#1A1A1A]/10 dark:bg-white/10 flex-shrink-0 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm animate-pulse space-y-4 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A]/15 dark:bg-white/15 flex-shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-5 w-36 bg-[#1A1A1A]/15 dark:bg-white/15 rounded" />
                  <div className="h-3 w-28 bg-[#DF6400]/20 rounded" />
                  <div className="h-3 w-20 bg-[#1A1A1A]/10 dark:bg-white/10 rounded" />
                </div>
              </div>
              <div className="h-12 w-full bg-[#F4F0EA] dark:bg-[#141210] rounded-xl" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="h-10 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl" />
                <div className="h-10 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl" />
                <div className="h-10 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

