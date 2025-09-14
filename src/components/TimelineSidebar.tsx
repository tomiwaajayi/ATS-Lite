'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Search,
  BarChart3,
  Brain,
  MessageSquareText,
  CheckCircle,
  History,
  Users,
  Filter,
  Target,
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChatStore, useUIStore } from '@/store';

const phaseIcons = {
  think: Brain,
  filter: Filter,
  rank: Target,
  speak: MessageSquareText,
  complete: CheckCircle,
};

const phaseColors = {
  think: 'bg-transparent',
  filter: 'bg-transparent',
  rank: 'bg-transparent',
  speak: 'bg-transparent',
  complete: 'bg-transparent',
};

function JSONViewer({ title, data }: { title: string; data: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className='mt-2'>
      <Button
        variant='ghost'
        size='sm'
        className='w-full justify-between text-left p-2 h-auto cursor-pointer'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className='text-xs font-medium'>{title}</span>
        {isExpanded ? <ChevronDown className='w-3 h-3' /> : <ChevronRight className='w-3 h-3' />}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='overflow-hidden'
          >
            <div className='mt-1 p-2 bg-background/50 rounded border text-xs font-mono'>
              <pre className='whitespace-pre-wrap text-xs overflow-x-auto'>
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhaseEntry({ phase, isLast, index }: { phase: any; isLast: boolean; index: number }) {
  const Icon = phaseIcons[phase.phase as keyof typeof phaseIcons] || Search;
  const colorClass = phaseColors[phase.phase as keyof typeof phaseColors] || 'bg-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      className='flex gap-3 relative'
    >
      {/* Timeline line */}
      {!isLast && (
        <motion.div
          className='absolute left-4 top-8 w-0.5 bg-border z-0'
          style={{ height: 'calc(100% - 2rem)' }}
          initial={{ scaleY: 0, transformOrigin: 'top' }}
          animate={{ scaleY: 1 }}
          transition={{
            duration: 0.6,
            delay: index * 0.1 + 0.3,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Phase icon */}
      <div
        className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 ring-2  relative z-10 ring-primary`}
      >
        <Icon className='w-4 h-4 text-black dark:text-white' />
      </div>

      {/* Phase content */}
      <div className='flex-1 pb-6'>
        <motion.div
          className='mb-2 space-y-1'
          initial='hidden'
          animate='visible'
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: index * 0.1 + 0.2,
              },
            },
          }}
        >
          <motion.h4
            className='font-medium text-sm'
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {phase.title}
          </motion.h4>
          <motion.p
            className='text-xs text-muted-foreground'
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {phase.description}
          </motion.p>
          <motion.p
            className='text-xs text-muted-foreground'
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            {phase.timestamp.toLocaleTimeString()}
          </motion.p>
        </motion.div>

        {/* Phase-specific content */}
        {phase.data && (
          <div className='space-y-2'>
            {/* Filter phase */}
            {phase.phase === 'filter' && phase.data.count !== undefined && (
              <div className='flex items-center gap-2 text-xs'>
                <Users className='w-3 h-3 dark:text-white text-black' />
                <span className='text-foreground font-medium'>
                  {phase.data.count} candidates found
                </span>
                {phase.data.total && (
                  <span className='text-muted-foreground'>(of {phase.data.total} total)</span>
                )}
              </div>
            )}

            {/* Ranking phase */}
            {phase.phase === 'rank' && phase.data.rankedIds && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-xs'>
                  <BarChart3 className='w-3 h-3 dark:text-white text-black' />
                  <span className='text-foreground font-medium'>
                    {phase.data.count} candidates ranked
                  </span>
                </div>

                {/* Show quick stats if available */}
                {phase.data.stats && (
                  <motion.div
                    className='text-xs text-muted-foreground space-y-1'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <div>📊 Avg exp: {phase.data.stats.avgExperience} yrs</div>
                    {phase.data.stats.topSkills?.length > 0 && (
                      <div>🔧 Top skills: {phase.data.stats.topSkills.join(', ')}</div>
                    )}
                    {phase.data.stats.locations?.length > 0 && (
                      <div>📍 Locations: {phase.data.stats.locations.join(', ')}</div>
                    )}
                  </motion.div>
                )}

                {/* Show top candidate IDs as pills */}
                <div className='flex flex-wrap gap-1'>
                  {phase.data.rankedIds.slice(0, 8).map((id: number) => (
                    <Badge key={id} variant='secondary' className='text-xs px-1.5 py-0.5'>
                      #{id}
                    </Badge>
                  ))}
                  {phase.data.rankedIds.length > 8 && (
                    <Badge variant='outline' className='text-xs px-1.5 py-0.5'>
                      +{phase.data.rankedIds.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* JSON viewers for plans */}
            {phase.data.filterPlan && (
              <JSONViewer title='View Filter Plan' data={phase.data.filterPlan} />
            )}

            {phase.data.rankingPlan && (
              <JSONViewer title='View Ranking Plan' data={phase.data.rankingPlan} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SessionEntry({
  session,
  index,
  newQueryStarted,
}: {
  session: any;
  index: number;
  newQueryStarted: boolean;
}) {
  // Start expanded if this is the active session
  const [isExpanded, setIsExpanded] = useState(session.isActive);

  useEffect(() => {
    // When a new query starts, collapse all non-active sessions
    if (newQueryStarted) {
      if (session.isActive) {
        setIsExpanded(true); // Expand the active session
      } else {
        setIsExpanded(false); // Collapse all other sessions
      }
    }
  }, [newQueryStarted, session.isActive]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-lg border transition-all ${
        session.isActive
          ? 'border-green-500 bg-green-500/5 dark:border-green-400'
          : session.completed
            ? 'border-blue-500 bg-blue-500/5 dark:border-blue-400'
            : 'border-blue-500 bg-blue-500/5 dark:border-blue-400 opacity-75'
      }`}
    >
      {/* Session header */}
      <div
        className='p-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg'
        onClick={handleToggle}
      >
        <div className='flex items-start gap-2'>
          <div className='flex-shrink-0 mt-0.5'>
            {isExpanded ? (
              <ChevronDown className='w-4 h-4 text-muted-foreground' />
            ) : (
              <ChevronRight className='w-4 h-4 text-muted-foreground' />
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='text-xs text-muted-foreground'>
                {session.timestamp.toLocaleTimeString()}
              </span>
              {session.isActive && (
                <Badge variant='default' className='text-xs px-1.5 py-0.5'>
                  Active
                </Badge>
              )}
            </div>

            <div className='font-medium text-sm truncate'>&quot;{session.query}&quot;</div>

            <div className='text-xs text-muted-foreground mt-1'>
              {session.phases.length} phases • {session.completed ? 'Completed' : 'In progress'}
            </div>
          </div>
        </div>
      </div>

      {/* Session timeline */}
      <AnimatePresence>
        {isExpanded && session.phases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t bg-muted/20'
          >
            <div className='p-4 space-y-0'>
              {session.phases.map((phase: any, phaseIndex: number) => (
                <PhaseEntry
                  key={phase.id}
                  phase={phase}
                  isLast={phaseIndex === session.phases.length - 1}
                  index={phaseIndex}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TimelineSidebar() {
  const { querySessions } = useChatStore();
  const { isTimelineSidebarVisible } = useUIStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastSessionCount, setLastSessionCount] = useState(0);

  // Track when new sessions are added to trigger collapse of previous ones
  const newQueryStarted = querySessions.length > lastSessionCount;

  // Create a dependency that tracks phase changes
  const phaseCounts = useMemo(
    () => querySessions.map(s => s.phases.length).join(','),
    [querySessions]
  );

  // Auto-scroll to show latest timeline items
  useEffect(() => {
    if (scrollContainerRef.current && querySessions.length > 0) {
      // Find the active session
      const activeSession = querySessions.find(session => session.isActive);

      // If there's an active session with phases, scroll to bottom
      if (activeSession && activeSession.phases.length > 0) {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 100); // Small delay to allow animations to start
      }
    }
  }, [phaseCounts, querySessions]); // Watch phase count changes

  useEffect(() => {
    setLastSessionCount(querySessions.length);
  }, [querySessions.length]);

  return (
    <motion.div
      className='fixed left-0 top-0 h-full z-30 w-80 bg-background/95 backdrop-blur-xl border-r border-border/50 flex flex-col'
      initial={{ x: '-20rem' }}
      animate={{ x: isTimelineSidebarVisible ? '0rem' : '-20rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className='p-4 border-b border-border/50 bg-background/50'>
        <h2 className='text-lg font-semibold'>Query Timeline</h2>
        <p className='text-xs text-muted-foreground'>Watch the ATS think</p>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className='flex-1 overflow-y-auto'>
        {querySessions.length === 0 ? (
          <div className='flex items-center justify-center h-full p-8'>
            <div className='text-center'>
              <History className='w-12 h-12 mx-auto mb-4 text-muted-foreground/30' />
              <p className='font-medium text-muted-foreground'>No queries yet</p>
              <p className='text-sm text-muted-foreground/70 mt-1'>
                Start a conversation to see the AI reasoning process
              </p>
            </div>
          </div>
        ) : (
          <div className='p-4 space-y-3'>
            <AnimatePresence>
              {querySessions.map((session, index) => (
                <SessionEntry
                  key={session.id}
                  session={session}
                  index={index}
                  newQueryStarted={newQueryStarted}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
