'use client';

import {
  BaseStyles,
  ThemeProvider as PrimerThemeProvider,
} from '@primer/react';
import { ReactNode } from 'react';
import QueryClientProvider from './query-client';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <PrimerThemeProvider preventSSRMismatch colorMode='light' dayScheme='light'>
      <BaseStyles>
        <QueryClientProvider>{children}</QueryClientProvider>
      </BaseStyles>
    </PrimerThemeProvider>
  );
}
