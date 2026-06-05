'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@study-vault/ui';
import { LoadingProvider } from './LoadingProvider';
import { Sidebar } from './Sidebar';
import { navigationMap } from '../../lib/navigation-map';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'loading') {
    return (
      <LoadingProvider isLoading={true}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Admin Dashboard...</p>
          </div>
        </div>
      </LoadingProvider>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <LoadingProvider isLoading={false}>
      <div className={cn(
        'min-h-screen bg-background',
        'flex flex-col md:flex-row'
      )}>
        <header className={cn(
          'md:hidden',
          'fixed top-0 left-0 right-0 z-50',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'border-b'
        )}>
          <div className="flex h-14 items-center px-4 gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-md"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-lg">Admin</span>
          </div>
        </header>

        <aside className={cn(
          'hidden md:flex',
          'fixed left-0 top-0 bottom-0',
          'w-64 border-r bg-background',
          'flex-col'
        )}>
          <Sidebar 
            navigationItems={navigationMap.filter(item => item.roles.includes('admin'))}
            session={session}
          />
        </aside>

        {sidebarOpen && (
          <>
            <div 
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className={cn(
              'md:hidden fixed left-0 top-0 bottom-0 z-50',
              'w-72 bg-background border-r',
              'transform transition-transform duration-300',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
              <Sidebar 
                navigationItems={navigationMap.filter(item => item.roles.includes('admin'))}
                session={session}
                onClose={() => setSidebarOpen(false)}
              />
            </aside>
          </>
        )}

        <main className={cn(
          'flex-1',
          'md:ml-64',
          'pt-14 md:pt-0',
          'min-h-screen'
        )}>
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </LoadingProvider>
  );
}

export default AppShell;
