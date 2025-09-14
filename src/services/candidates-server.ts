import fs from 'fs';
import path from 'path';
import { Candidate } from '@/types';
import { parseCandidateData } from './candidates';

// Server-side function for loading candidates from file system
export async function loadCandidatesServer(filePath: string): Promise<Candidate[]> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const text = fs.readFileSync(fullPath, 'utf8');
    return parseCandidateData(text);
  } catch (error) {
    console.error('Error loading candidates on server:', error);
    throw new Error(
      `Failed to load candidates: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
