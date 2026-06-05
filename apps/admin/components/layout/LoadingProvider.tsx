'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@study-vault/ui';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ 
  children, 
  isLoading: initialLoading 
}: { 
  children: React.ReactNode;
  isLoading: boolean;
}) {
  const [isLoading, setIsLoading] = useState(initialLoading);

  useEffect(() => {
    setIsLoading(initialLoading);
  }, [initialLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading && (
        <div className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
          'flex items-center justify-center'
        )}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export default LoadingProvider;
