'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui';

export default function DarkModeToggle() {
  const { isDarkMode, setIsDarkMode } = useUIStore();

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => setIsDarkMode(!isDarkMode)}
      className='transition-colors cursor-pointer'
    >
      {isDarkMode ? (
        <>
          <Sun className='w-4 h-4  text-white' />
        </>
      ) : (
        <>
          <Moon className='w-4 h-4  text-black' />
        </>
      )}
    </Button>
  );
}
