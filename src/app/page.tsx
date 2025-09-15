'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import CandidateDetails from '@/components/CandidateDetails';
import ChatPanel from '@/components/ChatPanel';
import DarkModeToggle from '@/components/DarkModeToggle';
import FieldsFilter from '@/components/FieldsFilter';
import ResultTable from '@/components/ResultTable';
import SplashScreen from '@/components/SplashScreen';
import TimelineSidebar from '@/components/TimelineSidebar';
import { Button } from '@/components/ui/button';
import { loadCandidates } from '@/services/candidates';
import { useCandidatesStore, useChatStore, useUIStore } from '@/store';

export default function HomePage() {
  const { setCandidates, setRankedIds } = useCandidatesStore();

  const { querySessions, clearSessions } = useChatStore();

  const { isTimelineSidebarVisible, toggleTimelineSidebar } = useUIStore();

  const [showSplash, setShowSplash] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);

    setTimeout(() => {
      setShowContent(true);
    }, 100);
  };

  useEffect(() => {
    setShowSplash(true);
    setShowContent(false);
  }, []);

  useEffect(() => {
    // Load candidates from CSV
    loadCandidates('/candidates.csv').then(candidates => {
      setCandidates(candidates);

      const allIds = candidates.map(c => c.id);
      setRankedIds(allIds);
    });
  }, [setCandidates, setRankedIds]);

  return (
    <>
      <AnimatePresence mode='wait'>
        {showSplash && <SplashScreen key='splash' onComplete={handleSplashComplete} />}
      </AnimatePresence>

      <AnimatePresence mode='wait'>
        {showContent && (
          <motion.div
            key='content'
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className='flex h-screen bg-background text-foreground'
          >
            {/* Timeline Sidebar */}
            <TimelineSidebar />

            {/* Main Content */}
            <motion.div
              className='flex-1 flex flex-col min-w-0'
              animate={{
                marginLeft: isTimelineSidebarVisible ? '20rem' : '0rem',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <header className='px-4 pt-4 bg-background/50 backdrop-blur-sm'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-4'>
                    <button
                      onClick={toggleTimelineSidebar}
                      className=' bg-background/90 backdrop-blur-sm rounded-md p-1.5  border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer'
                    >
                      {isTimelineSidebarVisible ? (
                        <ChevronLeft className='w-4 h-4' />
                      ) : (
                        <History className='w-4 h-4' />
                      )}
                    </button>
                    <h1 className='font-semibold text-xl'>Candidate Matches</h1>
                  </div>
                  <div className='flex items-center gap-3'>
                    <FieldsFilter />
                    <DarkModeToggle />
                    {querySessions.length > 0 && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={clearSessions}
                        className='cursor-pointer'
                      >
                        Clear History
                      </Button>
                    )}
                  </div>
                </div>
              </header>

              {/* Main Table */}
              <main className='flex-1 overflow-y-auto bg-background'>
                <ResultTable />
              </main>
            </motion.div>

            {/* Chat Panel */}
            <ChatPanel />

            {/* Candidate Details Sidebar */}
            <CandidateDetails />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
