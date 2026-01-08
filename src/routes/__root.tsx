import { BaseStyles, ThemeProvider } from '@primer/react';
import { createRootRoute, Outlet } from '@tanstack/react-router';

const RootLayout = () => {
  return (
    <ThemeProvider preventSSRMismatch>
      <BaseStyles>
        <Outlet />
      </BaseStyles>
    </ThemeProvider>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
