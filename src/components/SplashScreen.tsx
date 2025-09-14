'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer1 = setTimeout(() => setCurrentStep(1), 500); // Logo fade in
    const timer2 = setTimeout(() => setCurrentStep(2), 1500); // Subtitle appear
    const timer3 = setTimeout(() => setCurrentStep(3), 2500); // Start exit
    const timer4 = setTimeout(() => onComplete(), 3200); // Complete

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20'
        initial={{ opacity: 1 }}
        exit={{
          opacity: 0,
          scale: 1.1,
          filter: 'blur(10px)',
        }}
        transition={{
          duration: 0.7,
          ease: 'easeInOut',
        }}
      >
        {/* Animated background elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            className='absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent dark:from-blue-400/15 dark:via-purple-400/15'
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.div
            className='absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-pink-500/10 via-purple-500/10 to-transparent dark:from-pink-400/15 dark:via-purple-400/15'
            animate={{
              rotate: -360,
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Main content */}
        <div className='relative z-10 text-center'>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={
              currentStep >= 1
                ? {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }
                : {}
            }
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <motion.h1
              className='text-8xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2'
              animate={
                currentStep >= 1
                  ? {
                      backgroundPosition: ['0%', '100%', '0%'],
                    }
                  : {}
              }
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                backgroundSize: '200% 100%',
              }}
            >
              ATS
            </motion.h1>
            <motion.div
              className='text-4xl font-light tracking-[0.3em] bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400 dark:from-slate-300 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent mb-8'
              initial={{ opacity: 0, letterSpacing: '0.1em' }}
              animate={
                currentStep >= 1
                  ? {
                      opacity: 1,
                      letterSpacing: '0.3em',
                    }
                  : {}
              }
              transition={{
                duration: 1,
                delay: 0.3,
              }}
            >
              LITE
            </motion.div>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              currentStep >= 2
                ? {
                    opacity: 1,
                    y: 0,
                  }
                : {}
            }
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
          >
            <motion.p
              className='text-lg text-muted-foreground font-medium tracking-wide'
              initial={{ opacity: 0 }}
              animate={currentStep >= 2 ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Intelligent Candidate Matching
            </motion.p>
          </motion.div>

          {/* Loading dots */}
          <motion.div
            className='flex justify-center space-x-2 mt-8'
            initial={{ opacity: 0 }}
            animate={currentStep >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map(index => (
              <motion.div
                key={index}
                className='w-2 h-2 bg-primary rounded-full'
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Particle effects */}
        {mounted &&
          [...Array(12)].map((_, i) => {
            // Fixed positions to prevent hydration mismatch
            const positions = [
              { left: '10%', top: '20%' },
              { left: '80%', top: '15%' },
              { left: '25%', top: '70%' },
              { left: '90%', top: '60%' },
              { left: '15%', top: '85%' },
              { left: '70%', top: '25%' },
              { left: '5%', top: '50%' },
              { left: '85%', top: '80%' },
              { left: '40%', top: '10%' },
              { left: '60%', top: '90%' },
              { left: '30%', top: '35%' },
              { left: '75%', top: '45%' },
            ];

            return (
              <motion.div
                key={i}
                className='absolute w-2 h-2 rounded-full'
                style={{
                  left: positions[i].left,
                  top: positions[i].top,
                  background:
                    i % 3 === 0
                      ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)'
                      : i % 3 === 1
                        ? 'linear-gradient(45deg, #8b5cf6, #ec4899)'
                        : 'linear-gradient(45deg, #ec4899, #3b82f6)',
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
      </motion.div>
    </AnimatePresence>
  );
}
