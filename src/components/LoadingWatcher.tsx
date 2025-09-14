'use client';

import { useEffect } from 'react';
import NProgress from '@/services/nprogress';
import { useCandidatesStore, useChatStore } from '@/store';

export default function LoadingWatcher() {
  const candidatesLoading = useCandidatesStore(s => s.loading);
  const chatLoading = useChatStore(s => s.isLoading);
  const loading = candidatesLoading || chatLoading;

  useEffect(() => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [loading]);

  return null;
}
