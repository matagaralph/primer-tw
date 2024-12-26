import AppProvider from '@/components/AppProvider';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import './app.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: {
    template: '%s - Primer',
    default: 'Primer + Tailwindcss v4',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning data-light-theme='light' data-dark-theme='dark'>
      <body className='tw:antialiased'>
        <ThemeProvider
          storageKey='app-theme'
          defaultTheme='dark'
          attribute='data-color-mode'
          disableTransitionOnChange
        >
          <AppProvider>
            <Header />
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
