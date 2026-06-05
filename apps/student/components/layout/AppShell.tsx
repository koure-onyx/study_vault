"use client";

import { ReactNode, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingProvider } from "./LoadingProvider";
import { BottomNavigation } from "../navigation/BottomNavigation";
import { WaveformLoader } from "./WaveformLoader";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

function DesktopHeader({ title }: { title?: string }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200"
    >
      <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SV</span>
            </div>
            <span className="font-semibold text-stone-900 hidden sm:inline-block">
              Study Vault
            </span>
          </div>
        </div>
        
        {title && (
          <h1 className="text-lg font-medium text-stone-700 hidden md:block">
            {title}
          </h1>
        )}
        
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200" />
        </div>
      </div>
    </motion.header>
  );
}

function ShellContent({ children, title }: { children: ReactNode; title?: string }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:block">
        <DesktopHeader title={title} />
      </div>

      {/* Mobile Header - Simplified */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="flex items-center justify-center h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-xs">SV</span>
            </div>
            <span className="font-semibold text-stone-900 text-sm">Study Vault</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <BottomNavigation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children, title, showHeader = true }: AppShellProps) {
  return (
    <LoadingProvider>
      <ShellContent title={title}>
        {children}
      </ShellContent>
    </LoadingProvider>
  );
}
