import { Candidate } from './candidate';

export interface TableFieldConfig {
  key: keyof Candidate;
  label: string;
  type: 'text' | 'badge' | 'list' | 'currency' | 'boolean' | 'link' | 'number';
  width: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}
