'use client';

import React from 'react';
import { ThemeProvider } from '../lib/theme-context';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../lib/toast-context';
import StoreLayoutWrapper from './StoreLayoutWrapper';
import PwaRegister from './PwaRegister';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
          <PwaRegister />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
