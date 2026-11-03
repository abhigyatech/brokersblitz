import React from 'react';

export default function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] dark:bg-[#141210] text-[#1A1A1A] dark:text-white">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#1E1B17]/80 backdrop-blur-md border-b border-[#1A1A1A]/10 dark:border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="h-9 w-36 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl animate-pulse" />
          <div className="h-10 flex-1 max-w-xl bg-[#1A1A1A]/5 dark:bg-white/5 rounded-full animate-pulse" />
          <div className="h-9 w-24 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl animate-pulse hidden sm:block" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1A1A1A]/10 dark:border-white/10">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[#1A1A1A]/15 dark:bg-white/15 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="hidden lg:block space-y-4">
            <div className="p-4 bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 space-y-4">
              <div className="h-4 w-28 bg-[#DF6400]/20 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl animate-pulse" />
                <div className="h-8 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl animate-pulse" />
                <div className="h-8 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl animate-pulse" />
                <div className="h-8 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-[#DF6400]/20 rounded animate-pulse pt-2" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl animate-pulse" />
                <div className="h-8 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl animate-pulse" />
                <div className="h-8 bg-[#1A1A1A]/5 dark:bg-white/5 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1E1B17] rounded-2xl border border-[#1A1A1A]/10 dark:border-white/10 overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="h-48 w-full bg-[#1A1A1A]/10 dark:bg-white/10 relative">
                    <div className="absolute top-3 left-3 h-5 w-20 bg-black/20 rounded-md" />
                    <div className="absolute top-3 right-3 h-7 w-7 bg-black/20 rounded-full" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-28 bg-[#DF6400]/20 rounded-md" />
                      <div className="h-4 w-16 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-md" />
                    </div>
                    <div className="h-4 w-full bg-[#1A1A1A]/15 dark:bg-white/15 rounded-md" />
                    <div className="h-3 w-3/4 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-md" />
                    <div className="pt-2 border-t border-[#1A1A1A]/5 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1A1A1A]/15 dark:bg-white/15" />
                        <div className="h-3 w-20 bg-[#1A1A1A]/10 dark:bg-white/10 rounded-md" />
                      </div>
                      <div className="h-7 w-20 bg-[#DF6400]/15 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

