import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/session-provider';

export const metadata: Metadata = {
  title: 'Curso-Stone',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
