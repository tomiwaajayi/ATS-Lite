'use client';

import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/store';

export default function FieldsFilter() {
  const { visibleFields, toggleFieldVisibility, setVisibleFields } = useUIStore();

  // Define all available fields
  const allFields = [
    { key: 'id', label: 'ID', compulsory: true },
    { key: 'full_name', label: 'Name', compulsory: true },
    { key: 'title', label: 'Title' },
    { key: 'location', label: 'Location' },
    { key: 'timezone', label: 'Timezone' },
    { key: 'years_experience', label: 'Experience' },
    { key: 'skills', label: 'Skills' },
    { key: 'languages', label: 'Languages' },
    { key: 'education_level', label: 'Education' },
    { key: 'degree_major', label: 'Major' },
    { key: 'availability_weeks', label: 'Availability' },
    { key: 'willing_to_relocate', label: 'Relocate' },
    { key: 'work_preference', label: 'Work Style' },
    { key: 'notice_period_weeks', label: 'Notice Period' },
    { key: 'desired_salary_usd', label: 'Salary' },
    { key: 'open_to_contract', label: 'Contract' },
    { key: 'remote_experience_years', label: 'Remote Exp.' },
    { key: 'visa_status', label: 'Visa Status' },
    { key: 'citizenships', label: 'Citizenships' },
    { key: 'tags', label: 'Tags' },
    { key: 'last_active', label: 'Last Active' },
    { key: 'linkedin_url', label: 'LinkedIn' },
  ];

  const resetToDefault = () => {
    const defaultFields = [
      'id',
      'full_name',
      'title',
      'location',
      'years_experience',
      'skills',
      'desired_salary_usd',
    ];
    setVisibleFields(defaultFields);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm'>
          <SlidersHorizontal className='w-4 h-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-64' align='end'>
        <DropdownMenuLabel>Table Headers</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {allFields.map(field => (
          <DropdownMenuItem
            key={field.key}
            className={`flex items-center space-x-2 ${field.compulsory ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            onSelect={e => {
              e.preventDefault();
            }}
          >
            <Checkbox
              checked={visibleFields.includes(field.key)}
              disabled={field.compulsory}
              onCheckedChange={() => {
                if (!field.compulsory) {
                  toggleFieldVisibility(field.key);
                }
              }}
              onClick={e => {
                e.stopPropagation();
              }}
            />
            <span
              className='flex-1'
              onClick={e => {
                e.stopPropagation();
                if (!field.compulsory) {
                  toggleFieldVisibility(field.key);
                }
              }}
            >
              {field.label}
            </span>
            {field.compulsory && <span className='text-xs text-muted-foreground'>(Required)</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={resetToDefault}>
          <RotateCcw className='w-4 h-4 mr-2' />
          Reset to default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
