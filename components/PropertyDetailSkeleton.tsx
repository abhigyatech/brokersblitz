import React from 'react';

export default function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 bg-[#1A1A1A]/10 dark:bg-white/10 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl animate-pulse" />
            <div className="h-9 w-20 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-72 sm:h-96">
          <div className="md:col-span-2 h-full rounded-2xl bg-[#1A1A1A]/15 dark:bg-white/15 animate-pulse" />
          <div className="hidden md:grid grid-rows-2 gap-3 h-full">
            <div className="rounded-2xl bg-[#1A1A1A]/10 dark:bg-white/10 animate-pulse" />
            <div className="rounded-2xl bg-[#1A1A1A]/10 dark:bg-white/10 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-24 bg-[#DF6400]/20 rounded-md animate-pulse" />
                <div className="h-6 w-32 bg-emerald-500/15 rounded-md animate-pulse" />
              </div>
              <div className="h-8 w-3/4 bg-[#1A1A1A]/20 dark:bg-white/20 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-md animate-pulse" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="h-3 w-16 bg-[#1A1A1A]/10 dark:bg-white/10 rounded" />
                  <div className="h-5 w-24 bg-[#DF6400]/20 rounded" />
                </div>
              ))}
            </div>

            <div className="space-y-3 p-6 bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10">
              <div className="h-5 w-36 bg-[#1A1A1A]/15 dark:bg-white/15 rounded animate-pulse" />
              <div className="h-4 w-full bg-[#1A1A1A]/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-[#1A1A1A]/10 dark:bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-[#1A1A1A]/10 dark:bg-white/10 rounded animate-pulse" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-white dark:bg-[#1E1B17] rounded-3xl border border-[#1A1A1A]/10 dark:border-white/10 shadow-lg space-y-4 animate-pulse">
              <div className="h-8 w-36 bg-[#DF6400]/20 rounded-lg" />
              <div className="h-4 w-28 bg-[#1A1A1A]/10 dark:bg-white/10 rounded" />
              <div className="h-11 w-full bg-[#DF6400] rounded-xl opacity-40" />
              <div className="h-11 w-full bg-emerald-600 rounded-xl opacity-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

