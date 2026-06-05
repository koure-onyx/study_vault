import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  Settings, 
  BarChart3,
  Brain,
  Shield
} from 'lucide-react';

export type NavItem = {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  category: 'main' | 'content' | 'users' | 'settings';
};

export const navigationMap: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    roles: ['admin'],
    category: 'main'
  },
  {
    title: 'Analytics',
    path: '/admin/analytics',
    icon: BarChart3,
    roles: ['admin'],
    category: 'main'
  },
  {
    title: 'Users',
    path: '/admin/users',
    icon: Users,
    roles: ['admin'],
    category: 'users'
  },
  {
    title: 'Courses',
    path: '/admin/courses',
    icon: BookOpen,
    roles: ['admin'],
    category: 'content'
  },
  {
    title: 'Books',
    path: '/admin/books',
    icon: FileText,
    roles: ['admin'],
    category: 'content'
  },
  {
    title: 'Chapters',
    path: '/admin/chapters',
    icon: FileText,
    roles: ['admin'],
    category: 'content'
  },
  {
    title: 'Topics',
    path: '/admin/topics',
    icon: Brain,
    roles: ['admin'],
    category: 'content'
  },
  {
    title: 'AI Ingestion',
    path: '/admin/ai-ingestion',
    icon: Brain,
    roles: ['admin'],
    category: 'content'
  },
  {
    title: 'Roles & Permissions',
    path: '/admin/roles',
    icon: Shield,
    roles: ['admin'],
    category: 'users'
  },
  {
    title: 'Settings',
    path: '/admin/settings',
    icon: Settings,
    roles: ['admin'],
    category: 'settings'
  }
];

export const getNavItemsByCategory = (category: string): NavItem[] => {
  return navigationMap.filter(item => item.category === category);
};

export const findNavItemByPath = (path: string): NavItem | undefined => {
  return navigationMap.find(item => path.startsWith(item.path));
};
