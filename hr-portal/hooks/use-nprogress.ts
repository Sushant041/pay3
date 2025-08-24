'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function useNProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!NProgress.isStarted()) {
      NProgress.start();
      setLoading(true);
    }

    const timer = setTimeout(() => {
      NProgress.done();
      setLoading(false);
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
      setLoading(false);
    };
  }, [pathname, searchParams]);

  return loading;
}
