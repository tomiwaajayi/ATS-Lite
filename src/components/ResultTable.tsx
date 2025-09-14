'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, MapPin, Clock, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCandidatesStore, useUIStore } from '@/store';
import { TableFieldConfig } from '@/types';
import { Candidate } from '@/types/candidate';
import TableSkeleton from './TableSkeleton';

const FIELD_CONFIGS: TableFieldConfig[] = [
  {
    key: 'id',
    label: 'ID',
    type: 'number',
    width: 'w-16',
    className: 'text-muted-foreground',
  },
  {
    key: 'full_name',
    label: 'Name',
    type: 'text',
    width: 'w-52',
    className: 'font-semibold',
  },
  { key: 'title', label: 'Title', type: 'badge', width: 'w-56', icon: Briefcase },
  {
    key: 'location',
    label: 'Location',
    type: 'text',
    width: 'w-64',
    icon: MapPin,
  },
  { key: 'timezone', label: 'Timezone', type: 'text', width: 'w-48', icon: Clock },
  { key: 'years_experience', label: 'Experience', type: 'number', width: 'w-36' },
  { key: 'skills', label: 'Skills', type: 'list', width: 'w-88' },
  { key: 'languages', label: 'Languages', type: 'list', width: 'w-64' },
  { key: 'education_level', label: 'Education', type: 'badge', width: 'w-40' },
  { key: 'degree_major', label: 'Major', type: 'text', width: 'w-56' },
  {
    key: 'availability_weeks',
    label: 'Availability',
    type: 'number',
    width: 'w-36',
  },
  {
    key: 'willing_to_relocate',
    label: 'Relocate',
    type: 'boolean',
    width: 'w-32',
  },
  { key: 'work_preference', label: 'Work Style', type: 'badge', width: 'w-36' },
  {
    key: 'notice_period_weeks',
    label: 'Notice Period',
    type: 'number',
    width: 'w-32',
  },
  { key: 'desired_salary_usd', label: 'Salary', type: 'currency', width: 'w-32' },
  { key: 'open_to_contract', label: 'Contract', type: 'boolean', width: 'w-24' },
  {
    key: 'remote_experience_years',
    label: 'Remote Exp.',
    type: 'number',
    width: 'w-28',
  },
  { key: 'visa_status', label: 'Visa Status', type: 'badge', width: 'w-48' },
  { key: 'citizenships', label: 'Citizenship', type: 'list', width: 'w-40' },
  { key: 'tags', label: 'Tags', type: 'list', width: 'w-56' },
  { key: 'last_active', label: 'Last Active', type: 'text', width: 'w-32' },
  { key: 'linkedin_url', label: 'LinkedIn', type: 'link', width: 'w-32' },
];

const CellContent: React.FC<{
  candidate: Candidate;
  field: TableFieldConfig;
  compact?: boolean;
}> = ({ candidate, field, compact = false }) => {
  const value = candidate[field.key];
  const Icon = field.icon;

  if (value === null || value === undefined || value === '') {
    return <span className='text-muted-foreground'>—</span>;
  }

  const renderContent = () => {
    switch (field.type) {
      case 'text':
        return <span className={field.className}>{String(value)}</span>;

      case 'number':
        if (field.key === 'years_experience' || field.key === 'remote_experience_years') {
          const numValue = Number(value);
          const unit = numValue === 1 ? 'yr' : 'yrs';
          return (
            <span className='font-medium'>
              {String(value)} {unit}
            </span>
          );
        }
        if (field.key === 'availability_weeks' || field.key === 'notice_period_weeks') {
          return <span>{String(value)} weeks</span>;
        }
        return <span className={field.className}>{String(value)}</span>;

      case 'currency':
        return <span className='font-medium'>${Number(value).toLocaleString()}</span>;

      case 'badge':
        const getBadgeVariant = () => {
          if (field.key === 'work_preference') {
            return value === 'Remote' ? 'default' : value === 'Hybrid' ? 'secondary' : 'outline';
          }
          if (field.key === 'visa_status') {
            return value === 'Citizen'
              ? 'default'
              : value === 'Permanent Resident'
                ? 'secondary'
                : 'outline';
          }
          return 'secondary';
        };
        return (
          <Badge variant={getBadgeVariant()} className={compact ? 'text-xs' : undefined}>
            {String(value)}
          </Badge>
        );

      case 'boolean':
        const boolValue = value === 'Yes';
        return (
          <Badge
            variant={boolValue ? 'default' : 'secondary'}
            className={compact ? 'text-xs' : undefined}
          >
            {String(value)}
          </Badge>
        );

      case 'list':
        const items = String(value).split(/[;,]/).filter(Boolean);
        const displayLimit = compact ? 2 : 3;
        const displayItems = items.slice(0, displayLimit);
        const remainingCount = items.length - displayLimit;

        return (
          <div className='flex flex-wrap gap-1'>
            {displayItems.map((item, i) => (
              <Badge key={i} variant='outline' className={compact ? 'text-xs' : 'text-xs'}>
                {item.trim()}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <span className='text-xs text-muted-foreground'>+{remainingCount} more</span>
            )}
          </div>
        );

      case 'link':
        if (field.key === 'linkedin_url') {
          return (
            <a
              href={String(value)}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline inline-flex items-center gap-1 text-sm'
              onClick={e => e.stopPropagation()}
            >
              View Profile
              <ExternalLink className='w-3 h-3' />
            </a>
          );
        }
        return <span className={field.className}>{String(value)}</span>;

      default:
        return <span className={field.className}>{String(value)}</span>;
    }
  };

  return (
    <div className='flex items-center gap-2'>
      {Icon && !compact && <Icon className='w-4 h-4 text-muted-foreground' />}
      {renderContent()}
    </div>
  );
};

// Mobile card component
const CandidateCard: React.FC<{
  candidate: Candidate;
  onClick: () => void;
  visibleFields: string[];
  index: number;
  searchKey: string;
}> = ({ candidate, onClick, visibleFields, index, searchKey }) => {
  const visibleConfigs = FIELD_CONFIGS.filter(config =>
    visibleFields.includes(config.key as string)
  );

  return (
    <motion.div
      key={`${searchKey}-${candidate.id}`} // Key includes search context
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
        ease: 'easeOut',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className='cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20'
        onClick={onClick}
      >
        <CardContent className='p-4 space-y-3'>
          {/* Header with name and title */}
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <CellContent
                candidate={candidate}
                field={FIELD_CONFIGS.find(f => f.key === 'full_name')!}
              />
              <span className='text-xs text-muted-foreground'>#{candidate.id}</span>
            </div>
            <CellContent
              candidate={candidate}
              field={FIELD_CONFIGS.find(f => f.key === 'title')!}
              compact
            />
          </div>

          {/* Key info grid */}
          <div className='grid grid-cols-2 gap-2 text-sm'>
            {visibleConfigs
              .filter(config => !['full_name', 'title', 'id'].includes(config.key as string))
              .slice(0, 6)
              .map(config => (
                <div key={config.key} className='flex flex-col gap-1'>
                  <span className='text-xs font-medium text-muted-foreground'>{config.label}</span>
                  <CellContent candidate={candidate} field={config} compact />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Desktop table component
const DesktopTable: React.FC<{
  candidates: Candidate[];
  visibleFields: string[];
  onCandidateClick: (id: number) => void;
  searchKey: string; // Key that changes only when search results change
}> = ({ candidates, visibleFields, onCandidateClick, searchKey }) => {
  const visibleConfigs = FIELD_CONFIGS.filter(config =>
    visibleFields.includes(config.key as string)
  );

  // Calculate minimum table width based on visible column widths
  const totalWidth = visibleConfigs.reduce((sum, config) => {
    const widthMap: Record<string, number> = {
      'w-16': 64,
      'w-20': 80,
      'w-24': 96,
      'w-28': 112,
      'w-32': 128,
      'w-36': 144,
      'w-40': 160,
      'w-44': 176,
      'w-48': 192,
      'w-56': 224,
      'w-64': 256,
      'w-80': 320,
    };
    return sum + (widthMap[config.width] || 128);
  }, 0);

  return (
    <div className='overflow-hidden rounded-lg border flex flex-col max-h-full'>
      <div className='overflow-auto'>
        <Table className='table-fixed' style={{ minWidth: `${totalWidth}px` }}>
          <colgroup>
            {visibleConfigs.map(config => (
              <col key={config.key} className={config.width} />
            ))}
          </colgroup>
          <TableHeader className='sticky top-0 bg-slate-100 dark:bg-slate-900 z-10'>
            <TableRow>
              {visibleConfigs.map(config => (
                <TableHead key={config.key} className={`font-medium ${config.width} border-b`}>
                  <div className='flex items-center gap-2 truncate'>
                    <span className='truncate'>{config.label}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {candidates.map((candidate, rowIndex) => (
                <motion.tr
                  key={`${searchKey}-${candidate.id}`}
                  className='cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-b-0'
                  onClick={() => onCandidateClick(candidate.id)}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{
                    duration: 0.4,
                    delay: rowIndex * 0.05,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {visibleConfigs.map(config => (
                    <TableCell key={config.key} className={`py-3 ${config.width}`}>
                      <div className='truncate'>
                        <CellContent candidate={candidate} field={config} />
                      </div>
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState: React.FC<{ hasSearched: boolean }> = ({ hasSearched }) => (
  <div className='flex flex-1 items-center justify-center p-4'>
    <div className='text-center p-8'>
      <div className='text-6xl mb-4'>{hasSearched ? '❌' : '🔍'}</div>
      <div className='text-xl font-semibold mb-3'>
        {hasSearched ? 'No candidates found' : 'No results yet'}
      </div>
      <div className='text-muted-foreground max-w-md'>
        {hasSearched
          ? 'No candidates match your current criteria. Try adjusting your search terms or expanding your requirements.'
          : 'Start by asking a question in the chat to find candidates that match your needs.'}
      </div>
    </div>
  </div>
);

// Main component
export default function ResultTable() {
  const { getRankedCandidates, setSelectedCandidateId, loading, hasSearched, rankedIds } =
    useCandidatesStore();
  const { visibleFields, setChatExpanded } = useUIStore();

  const candidates = getRankedCandidates();

  // Generate a key that only changes when search results change, not when UI filters change
  const searchKey = `search-${rankedIds.join('-')}-${candidates.length}`;

  const handleCandidateClick = (candidateId: number) => {
    setSelectedCandidateId(candidateId);
    setChatExpanded(false);
  };

  if (loading) {
    return <TableSkeleton />;
  }

  if (candidates.length === 0) {
    return <EmptyState hasSearched={hasSearched} />;
  }

  return (
    <div className='h-full flex flex-col p-4'>
      <motion.div
        className='flex flex-col h-full'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Results summary */}
        <div className='mb-4 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Responsive content */}
        <div className='flex-1 min-h-0 flex flex-col'>
          {/* Mobile: Card layout */}
          <div className='lg:hidden overflow-y-auto'>
            <div className='grid gap-3'>
              <AnimatePresence>
                {candidates.map((candidate, index) => (
                  <CandidateCard
                    key={`${searchKey}-${candidate.id}`}
                    candidate={candidate}
                    index={index}
                    searchKey={searchKey}
                    onClick={() => handleCandidateClick(candidate.id)}
                    visibleFields={visibleFields}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop: Table layout */}
          <div className='hidden lg:flex flex-1 flex-col min-h-0'>
            <DesktopTable
              candidates={candidates}
              visibleFields={visibleFields}
              searchKey={searchKey}
              onCandidateClick={handleCandidateClick}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
