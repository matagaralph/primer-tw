'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import {
  BaseStyles,
  ThemeProvider as PrimerThemeProvider,
} from '@primer/react';
import QueryClientProvider from './query-client';
import { useEffect, useState } from 'react';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <PrimerStyle>{children}</PrimerStyle>
    </NextThemesProvider>
  );
}

function PrimerStyle({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme(); // Use resolvedTheme to handle 'system'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <PrimerThemeProvider
      preventSSRMismatch
      // Map 'light' or 'dark' from next-themes, ignore 'system'
      colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
      dayScheme='light'
      nightScheme='dark_dimmed'
    >
      <BaseStyles>
        <QueryClientProvider>{children}</QueryClientProvider>
      </BaseStyles>
    </PrimerThemeProvider>
  );
}
