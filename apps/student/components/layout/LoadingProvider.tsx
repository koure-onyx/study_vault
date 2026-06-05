"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { WaveformLoader } from "./WaveformLoader";

interface LoadingContextType {
  isLoading: boolean;
  isAuthChecking: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Determine if we're still checking auth
  const isAuthChecking = status === "loading" || status === "unauthenticated";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state only during initial auth check or when explicitly set
  const shouldShowLoader = !isMounted || isAuthChecking || isLoading;

  if (shouldShowLoader) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-50">
        <WaveformLoader size="lg" />
        <p className="mt-4 text-sm font-medium text-stone-500 animate-pulse">
          {status === "loading" ? "Verifying identity..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <LoadingContext.Provider value={{ isLoading, isAuthChecking, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
