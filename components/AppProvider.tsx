'use client';

import { StyledComponentsRegistry } from '@/app/registry';
import { BaseStyles, ThemeProvider as PrimerProvider, theme } from '@primer/react';
import deepmerge from 'deepmerge';
import { useTheme } from 'next-themes';
import { type ReactNode } from 'react';

const customTheme = deepmerge(theme, {
  fonts: {
    normal: 'Inter-var,InterVariable, Inter, sans-serif',
  },
});

export default function AppProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <StyledComponentsRegistry>
      {/* @ts-expect-error theme values are valid */}
      <PrimerProvider colorMode={theme} theme={customTheme} preventSSRMismatch>
        <BaseStyles>{children}</BaseStyles>
      </PrimerProvider>
    </StyledComponentsRegistry>
  );
}
