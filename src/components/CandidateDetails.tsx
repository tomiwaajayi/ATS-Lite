'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Mail,
  Globe,
  BadgeDollarSign,
  Languages,
  Timer,
  Code,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  ScrollText,
  Fence,
  Flag,
  Tag,
  Info,
  Wrench,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCandidatesStore } from '@/store';

export default function CandidateDetails() {
  const { getSelectedCandidate, setSelectedCandidateId } = useCandidatesStore();
  const [showFullJSON, setShowFullJSON] = useState(false);

  const selectedCandidate = getSelectedCandidate();

  if (!selectedCandidate) return null;

  return (
    <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidateId(null)}>
      <SheetContent className='w-[400px] sm:w-[540px] px-0 pt-0 flex flex-col'>
        <SheetHeader className='px-4 pt-8 pb-4 flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10'>
          <SheetTitle className='text-2xl font-bold'>{selectedCandidate.full_name}</SheetTitle>
          <SheetDescription>Candidate #{selectedCandidate.id}</SheetDescription>
        </SheetHeader>

        <motion.div
          className='px-4 pt-2 pb-6 space-y-6 overflow-y-auto flex-1'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Full Candidate JSON */}
          <div className='space-y-3'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFullJSON(!showFullJSON)}
              className='w-full justify-between cursor-pointer'
            >
              <div className='flex items-center gap-2'>
                <Code className='w-4 h-4' />
                <span>Candidate JSON</span>
              </div>
              {showFullJSON ? (
                <ChevronDown className='w-4 h-4' />
              ) : (
                <ChevronRight className='w-4 h-4' />
              )}
            </Button>

            <AnimatePresence>
              {showFullJSON && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut',
                  }}
                  className='overflow-hidden'
                >
                  <motion.pre
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.1 }}
                    className='text-xs bg-muted/50 border border-border/50 p-4 rounded-lg overflow-auto max-h-96 font-mono leading-relaxed'
                  >
                    {JSON.stringify(selectedCandidate, null, 2)}
                  </motion.pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Basic Info */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='text-sm'>
                {selectedCandidate.title}
              </Badge>
            </div>

            <div className='flex items-center gap-2 text-muted-foreground'>
              <MapPin className='w-4 h-4' />
              <span>{selectedCandidate.location}</span>
            </div>

            <div className='flex items-center gap-2 text-muted-foreground'>
              <Clock className='w-4 h-4' />
              <span>{selectedCandidate.years_experience} years experience</span>
            </div>

            {selectedCandidate.linkedin_url && (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Mail className='w-4 h-4' />
                <a
                  href={selectedCandidate.linkedin_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>

          <Separator />

          {/* Skills */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Wrench className='w-4 h-4' />
              <h3 className='font-semibold'>Skills</h3>
            </div>
            <div className='flex flex-wrap gap-2'>
              {selectedCandidate.skills?.split(';').map((skill: string, i: number) => (
                <Badge key={i} variant='outline'>
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Tag className='w-4 h-4' />
              <h3 className='font-semibold'>Tags</h3>
            </div>
            <div className='flex flex-wrap gap-2'>
              {selectedCandidate.tags?.split(',').map((tag: string, i: number) => (
                <Badge key={i} variant='outline'>
                  {tag.trim().charAt(0).toUpperCase() + tag.trim().slice(1).toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Languages */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Languages className='w-4 h-4' />
              <h3 className='font-semibold'>Languages</h3>
            </div>
            <div className='flex flex-wrap gap-2'>
              {selectedCandidate.languages?.split(';').map((language: string, i: number) => (
                <Badge key={i} variant='outline'>
                  {language.trim().charAt(0).toUpperCase() + language.trim().slice(1).toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Additional Details */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Info className='w-4 h-4' />
              <h3 className='font-semibold'>Details</h3>
            </div>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>Availability</span>
                <div className='font-medium mt-2'>{selectedCandidate.availability_weeks} weeks</div>
              </div>

              <div>
                <span className='text-muted-foreground'>Willing to relocate</span>
                <div className='font-medium mt-2'>
                  {selectedCandidate.willing_to_relocate === 'Yes' ? (
                    <Badge variant='default'>Yes</Badge>
                  ) : (
                    <Badge variant='secondary'>No</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Professional Summary */}
          {selectedCandidate.summary && (
            <>
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <FileText className='w-4 h-4' />
                  <h3 className='font-semibold'>Summary</h3>
                </div>
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  {selectedCandidate.summary}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Other Information */}
          <div className='space-y-4 pb-8'>
            <h3 className='font-semibold'>Additional Information</h3>

            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <BadgeDollarSign className='w-4 h-4' />
                  <span>Expected Salary</span>
                </div>
                <div className='font-medium'>
                  ${selectedCandidate.desired_salary_usd.toLocaleString()}
                </div>
              </div>

              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Timer className='w-4 h-4' />
                  <span>Time Zone</span>
                </div>
                <div className='font-medium'>{selectedCandidate.timezone}</div>
              </div>

              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <GraduationCap className='w-4 h-4' />
                  <span>Education</span>
                </div>
                <div className='font-medium'>{selectedCandidate.education_level}</div>
              </div>

              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <ScrollText className='w-4 h-4' />
                  <span>Major</span>
                </div>
                <div className='font-medium'>{selectedCandidate.degree_major}</div>
              </div>
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Fence className='w-4 h-4' />
                  <span>Work Preference</span>
                </div>
                <div className='font-medium'>{selectedCandidate.work_preference}</div>
              </div>
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Flag className='w-4 h-4' />
                  <span>Notice Period</span>
                </div>
                <div className='font-medium'>{selectedCandidate.notice_period_weeks} weeks</div>
              </div>
              <div>
                <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                  <Globe className='w-4 h-4' />
                  <span>Citizenship</span>
                </div>
                <div className='font-medium'>{selectedCandidate.citizenships}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
