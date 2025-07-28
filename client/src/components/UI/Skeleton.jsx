import React from 'react';

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const ProductTrackingSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Product Info Skeleton */}
    <div className="p-6 bg-white border rounded-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="w-48 h-8 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="w-36 h-4 bg-gray-200 rounded"></div>
            <div className="w-36 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="w-56 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Journey Timeline Skeleton */}
    <div className="p-6 bg-white border rounded-xl">
      <div className="w-48 h-6 mb-6 bg-gray-200 rounded"></div>
      <div className="relative">
        <div className="absolute left-8 top-3 bottom-3 w-0.5 bg-gray-200"></div>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative flex gap-6">
              <div className="relative flex items-center justify-center flex-shrink-0 w-16 h-16 bg-gray-200 rounded-full">
              </div>
              <div className="flex-1">
                <div className="p-6 bg-gray-100 rounded-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-3">
                      <div className="w-32 h-6 bg-gray-200 rounded"></div>
                      <div className="space-y-2">
                        <div className="w-48 h-4 bg-gray-200 rounded"></div>
                        <div className="w-40 h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
