'use client';

import { ToastProvider } from '@/components/ui/toast-provider';

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
} 