'use client';
import { Button, Text } from '@primer/react';
import { useTheme } from 'next-themes';

export default function Home() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className='h-14 border-b border-default'></div>
      <div className='max-w-7xl mx-auto px-4 pt-8'>
        <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          Activate
        </Button>

        <div className='max-w-2xl pt-4'>
          <Text>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Libero eos
            dolore veniam ea, esse reprehenderit quod, quibusdam voluptatibus
            facilis error illo pariatur molestiae ipsum aperiam odio, recusandae
            repudiandae!
          </Text>
        </div>
      </div>
    </>
  );
}
