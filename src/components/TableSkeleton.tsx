'use client';

import { motion } from 'framer-motion';

export default function TableSkeleton() {
  return (
    <div className='p-4'>
      <motion.div
        className='border rounded-lg overflow-hidden'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header skeleton */}
        <div className='bg-muted/30 p-4 border-b'>
          <div className='flex gap-4'>
            <div className='w-12 h-4 bg-muted animate-pulse rounded' />
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='h-4 bg-muted animate-pulse rounded'
                style={{ width: `${Math.random() * 60 + 80}px` }}
              />
            ))}
          </div>
        </div>

        {/* Row skeletons */}
        <div className='space-y-0'>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className='flex gap-4 p-4 border-b border-border/50'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <div className='w-12 h-4 bg-muted animate-pulse rounded' />
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className='h-4 bg-muted animate-pulse rounded'
                  style={{
                    width: `${Math.random() * 80 + 60}px`,
                    animationDelay: `${(i * 6 + j) * 0.1}s`,
                  }}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
