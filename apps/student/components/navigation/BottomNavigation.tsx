"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Brain,
  Trophy,
  User,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Home",
  },
  {
    href: "/learn",
    icon: BookOpen,
    label: "Learn",
  },
  {
    href: "/quiz",
    icon: Brain,
    label: "Quiz",
  },
  {
    href: "/vault",
    icon: Trophy,
    label: "Vault",
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-stone-100"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? "text-stone-900"
                      : "text-stone-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive
                      ? "text-stone-900"
                      : "text-stone-400"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
