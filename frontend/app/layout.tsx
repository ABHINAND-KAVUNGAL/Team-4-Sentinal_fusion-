import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'Sentinel Fusion | Digital Intelligence Fusion Platform',
  description: 'AI-assisted digital intelligence and forensic investigation workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen selection:bg-blue-600/30 selection:text-white">
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
