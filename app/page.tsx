'use client';
import { Button, Heading } from '@primer/react';
import { useTheme } from 'next-themes';

function IndexPage() {
  const { setTheme, theme } = useTheme();
  return (
    <main className='tw:mx-auto tw:max-w-7xl tw:px-4 tw:pt-8'>
      <Heading variant='medium'>Primer + Tailwind v4</Heading>

      <Button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        variant='primary'
        className='tw:mt-4'
      >
        Theme
      </Button>
    </main>
  );
}

export default IndexPage;
