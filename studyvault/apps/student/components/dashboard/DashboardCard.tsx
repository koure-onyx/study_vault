import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  icon: string;
  children: ReactNode;
}

export default function DashboardCard({ title, icon, children }: DashboardCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}
