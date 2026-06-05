'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@study-vault/ui';

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast?: boolean;
}

export function Breadcrumb() {
  const pathname = usePathname();
  
  // Skip breadcrumb on root paths
  if (!pathname || pathname === '/' || pathname === '/dashboard') {
    return null;
  }

  // Parse path segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const items: BreadcrumbItem[] = [];
  let accumulatedPath = '';
  
  // Add home link
  items.push({
    label: 'Home',
    href: '/dashboard',
    isLast: segments.length === 0
  });

  // Process each segment
  segments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;
    
    // Decode and format segment label
    let label = decodeURIComponent(segment);
    
    // Capitalize first letter
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    // Replace hyphens with spaces
    label = label.replace(/-/g, ' ');
    
    // Handle special slugs (board, program, subject)
    if (segment.includes('-board')) {
      label = label.replace('-board', '') + ' Board';
    } else if (segment.includes('-program')) {
      label = label.replace('-program', '') + ' Program';
    } else if (segment.includes('-subject')) {
      label = label.replace('-subject', '') + ' Subject';
    }

    const isLast = index === segments.length - 1;
    
    items.push({
      label,
      href: accumulatedPath,
      isLast
    });
  });

  return (
    <nav 
      className={cn(
        'flex items-center space-x-1 text-sm',
        'text-muted-foreground',
        'overflow-x-auto',
        'whitespace-nowrap',
        'py-2'
      )}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {/* Separator */}
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
          )}
          
          {/* Link or Current Page */}
          {item.isLast ? (
            <span 
              className={cn(
                'font-medium text-foreground',
                'px-2 py-1 rounded-md',
                'bg-accent/50'
              )}
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className={cn(
                'hover:text-foreground',
                'hover:bg-accent/50',
                'px-2 py-1 rounded-md',
                'transition-colors',
                'flex items-center',
                item.label === 'Home' && 'p-1'
              )}
            >
              {item.label === 'Home' ? (
                <Home className="h-4 w-4" />
              ) : (
                item.label
              )}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;
