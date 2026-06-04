'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, SpringOptions } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ============================================================================
// SYNTAX COMPLIANCE: SPRING PRESETS (from syntax-enforcer.md)
// ============================================================================
const springs = {
  snappyButton: { stiffness: 400, damping: 20, mass: 0.5 } as SpringOptions,
  softCards: { stiffness: 100, damping: 15, mass: 1.0 } as SpringOptions,
  inputShake: { stiffness: 300, damping: 25, mass: 0.8 } as SpringOptions,
  toastEntry: { stiffness: 300, damping: 25, mass: 0.8 } as SpringOptions,
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'family';
    status: 'active' | 'expired' | 'cancelled';
    expires_at: string;
  };
  board?: string;
  grade?: string;
}

interface CourseRecord {
  _id: string;
  title: string;
  subject: string;
  program_name: string;
  board: string;
  ingestion_status: 'pending' | 'processing' | 'complete';
  workflow_status: 'draft' | 'pending_review' | 'live' | 'rejected';
  total_chapters: number;
  total_topics: number;
}

interface WebhookLog {
  _id: string;
  provider: 'easypaisa' | 'jazzcash';
  transaction_id: string;
  status_code: number;
  status_text: 'success' | 'pending' | 'failed';
  timestamp: string;
  payload_summary: string;
}

interface SystemMetrics {
  total_users: number;
  active_subscriptions: number;
  ai_requests_today: number;
  webhook_success_rate: number;
  provider_distribution: {
    gemini: number;
    openai: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: string;
}

// ============================================================================
// SUB-COMPONENT: DENSE DATA TABLE WITH INLINE MUTATIONS
// ============================================================================
interface DenseDataMatrixProps {
  users: UserRecord[];
  courses: CourseRecord[];
  onUserUpdate: (userId: string, field: keyof UserRecord['subscription'], value: any) => Promise<void>;
  onCourseUpdate: (courseId: string, field: 'workflow_status', value: CourseRecord['workflow_status']) => Promise<void>;
}

const DenseDataMatrix: React.FC<DenseDataMatrixProps> = ({ users, courses, onUserUpdate, onCourseUpdate }) => {
  const [editingCell, setEditingCell] = useState<{ type: 'user' | 'course'; id: string; field: string } | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [doubleClickTimer, setDoubleClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const handleSingleClick = (type: 'user' | 'course', id: string, field: string, currentValue: string) => {
    if (doubleClickTimer) {
      // Double click detected
      clearTimeout(doubleClickTimer);
      setDoubleClickTimer(null);
      setEditingCell({ type, id, field });
      setTempValue(currentValue);
    } else {
      // Single click - wait for potential double click
      const timer = setTimeout(() => {
        setDoubleClickTimer(null);
        // Show tooltip or info on single click
      }, 250);
      setDoubleClickTimer(timer);
    }
  };

  const handleSave = async () => {
    if (!editingCell) return;

    try {
      if (editingCell.type === 'user') {
        await onUserUpdate(editingCell.id, editingCell.field as keyof UserRecord['subscription'], tempValue);
      } else {
        await onCourseUpdate(editingCell.id, 'workflow_status', tempValue as CourseRecord['workflow_status']);
      }
      setEditingCell(null);
    } catch (error) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditingCell(null);
  };

  return (
    <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
      {/* Users Table */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden flex flex-col">
        <div className="px-3 py-2 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-white/10">
          <h3 className="text-sm font-semibold text-purple-300">User Overrides</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900/95 backdrop-blur">
              <tr className="text-gray-400 text-left">
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 text-gray-300 truncate max-w-[150px]">{user.email}</td>
                  <td className="px-3 py-2">
                    {editingCell?.type === 'user' && editingCell.id === user._id && editingCell.field === 'plan' ? (
                      <motion.input
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        autoFocus
                        className="w-full bg-purple-500/20 border border-purple-400/50 rounded px-2 py-1 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    ) : (
                      <span
                        onClick={() => handleSingleClick('user', user._id, 'plan', user.subscription.plan)}
                        className="cursor-pointer hover:text-purple-300 transition-colors"
                        title="Double-click to edit"
                      >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          user.subscription.plan === 'premium' ? 'bg-purple-500/20 text-purple-300' :
                          user.subscription.plan === 'basic' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {user.subscription.plan}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      user.subscription.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      user.subscription.status === 'expired' ? 'bg-red-500/20 text-red-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {user.subscription.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400">
                    {new Date(user.subscription.expires_at).toLocaleDateString('en-PK')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden flex flex-col">
        <div className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-white/10">
          <h3 className="text-sm font-semibold text-blue-300">Course Workflow</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900/95 backdrop-blur">
              <tr className="text-gray-400 text-left">
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Board</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Topics</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 text-gray-300 truncate max-w-[150px]">{course.title}</td>
                  <td className="px-3 py-2 text-gray-400">{course.board}</td>
                  <td className="px-3 py-2">
                    {editingCell?.type === 'course' && editingCell.id === course._id && editingCell.field === 'workflow_status' ? (
                      <motion.select
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        autoFocus
                        className="w-full bg-blue-500/20 border border-blue-400/50 rounded px-2 py-1 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="live">Live</option>
                        <option value="rejected">Rejected</option>
                      </motion.select>
                    ) : (
                      <span
                        onClick={() => handleSingleClick('course', course._id, 'workflow_status', course.workflow_status)}
                        className="cursor-pointer hover:text-blue-300 transition-colors"
                        title="Double-click to edit"
                      >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          course.workflow_status === 'live' ? 'bg-green-500/20 text-green-300' :
                          course.workflow_status === 'pending_review' ? 'bg-yellow-500/20 text-yellow-300' :
                          course.workflow_status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {course.workflow_status}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-400">{course.total_topics}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: WEBHOOK STREAM & SVG CHART
// ============================================================================
interface WebhookPipelineProps {
  logs: WebhookLog[];
  metrics: SystemMetrics;
  providerFilter: 'all' | 'easypaisa' | 'jazzcash';
  onFilterChange: (provider: 'all' | 'easypaisa' | 'jazzcash') => void;
}

const WebhookPipeline: React.FC<WebhookPipelineProps> = ({ logs, metrics, providerFilter, onFilterChange }) => {
  const filteredLogs = providerFilter === 'all' ? logs : logs.filter(log => log.provider === providerFilter);
  
  // Generate SVG path for success rate chart
  const generateChartPath = useCallback(() => {
    if (filteredLogs.length < 2) return '';
    
    const width = 300;
    const height = 60;
    const padding = 5;
    const points = filteredLogs.slice(-20).map((log, i) => {
      const x = padding + (i / (filteredLogs.length - 1)) * (width - 2 * padding);
      const y = height - padding - (log.status_code === 200 ? 0 : log.status_code >= 500 ? height - 2 * padding : (height - 2 * padding) / 2);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [filteredLogs]);

  const [chartPath, setChartPath] = useState(generateChartPath());

  useEffect(() => {
    setChartPath(generateChartPath());
  }, [generateChartPath]);

  return (
    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-lg border border-white/10 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">Webhook Pipeline</h3>
        <div className="flex gap-2">
          {(['all', 'easypaisa', 'jazzcash'] as const).map((provider) => (
            <button
              key={provider}
              onClick={() => onFilterChange(provider)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                providerFilter === provider
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                  : 'bg-gray-500/20 text-gray-400 border border-transparent hover:border-gray-400/30'
              }`}
            >
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Success Rate Chart */}
      <div className="relative h-16 bg-gray-900/50 rounded-lg overflow-hidden">
        <svg viewBox="0 0 300 60" className="w-full h-full">
          <motion.path
            d={chartPath}
            fill="none"
            stroke="url(#chartGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          Success Rate: {(metrics.webhook_success_rate * 100).toFixed(1)}%
        </div>
      </div>

      {/* Live Log Feed */}
      <div className="flex-1 overflow-auto max-h-48 space-y-2">
        <AnimatePresence>
          {filteredLogs.slice(0, 10).map((log) => (
            <motion.div
              key={log._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={springs.toastEntry}
              className={`flex items-center gap-3 p-2 rounded border-l-2 ${
                log.status_code === 200 ? 'bg-green-500/10 border-green-500' :
                log.status_code >= 500 ? 'bg-red-500/10 border-red-500 animate-pulse' :
                'bg-yellow-500/10 border-yellow-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                log.status_code === 200 ? 'bg-green-500' :
                log.status_code >= 500 ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              <span className="text-xs text-gray-300 flex-1 truncate">{log.transaction_id}</span>
              <span className="text-[10px] text-gray-400">{log.provider.toUpperCase()}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                log.status_code === 200 ? 'bg-green-500/20 text-green-300' :
                log.status_code >= 500 ? 'bg-red-500/20 text-red-300' :
                'bg-yellow-500/20 text-yellow-300'
              }`}>
                {log.status_code}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: AI PROVIDER CONTROL & SYSTEM TERMINAL
// ============================================================================
interface ReasoningEngineControlProps {
  currentProvider: 'gemini' | 'openai' | 'auto';
  onProviderChange: (provider: 'gemini' | 'openai' | 'auto') => Promise<void>;
  logs: LogEntry[];
}

const ReasoningEngineControl: React.FC<ReasoningEngineControlProps> = ({ 
  currentProvider, 
  onProviderChange,
  logs 
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-lg border border-white/10 p-4 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-200">Reasoning Engine Control</h3>
      
      {/* Segmented Provider Control */}
      <div className="flex bg-gray-900/50 rounded-lg p-1 gap-1">
        {(['gemini', 'auto', 'openai'] as const).map((provider) => (
          <motion.button
            key={provider}
            onClick={() => onProviderChange(provider)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              currentProvider === provider
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            whileTap={{ scale: 0.95 }}
            transition={springs.snappyButton}
          >
            {provider === 'gemini' ? 'Gemini Pro' : provider === 'openai' ? 'OpenAI GPT' : 'Auto-Balance'}
          </motion.button>
        ))}
      </div>

      {/* System Terminal */}
      <div 
        ref={terminalRef}
        className="flex-1 bg-gray-950 rounded-lg p-3 font-mono text-xs overflow-auto max-h-48 border border-gray-800"
      >
        <AnimatePresence>
          {logs.slice(-20).map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-1 ${
                log.level === 'error' ? 'text-red-400' :
                log.level === 'warn' ? 'text-yellow-400' :
                'text-green-400'
              }`}
            >
              <span className="text-gray-500">[{log.timestamp}]</span>{' '}
              <span className="uppercase text-[10px] mr-2">[{log.level}]</span>
              {log.message}
              {log.context && <span className="text-gray-500 ml-2">→ {log.context}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AdminControlPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    total_users: 0,
    active_subscriptions: 0,
    ai_requests_today: 0,
    webhook_success_rate: 0,
    provider_distribution: { gemini: 0, openai: 0 }
  });
  const [providerFilter, setProviderFilter] = useState<'all' | 'easypaisa' | 'jazzcash'>('all');
  const [currentProvider, setCurrentProvider] = useState<'gemini' | 'openai' | 'auto'>('auto');
  const [loading, setLoading] = useState(true);

  // Fetch admin data
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin?callbackUrl=/control');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, coursesRes, logsRes, metricsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/courses'),
          fetch('/api/admin/webhooks'),
          fetch('/api/admin/metrics')
        ]);

        if (usersRes.ok) setUsers(await usersRes.json());
        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (logsRes.ok) setWebhookLogs(await logsRes.json());
        if (metricsRes.ok) setMetrics(await metricsRes.json());
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll for webhook updates every 5 seconds
    const interval = setInterval(async () => {
      try {
        const logsRes = await fetch('/api/admin/webhooks');
        if (logsRes.ok) setWebhookLogs(await logsRes.json());
        
        const metricsRes = await fetch('/api/admin/metrics');
        if (metricsRes.ok) setMetrics(await metricsRes.json());
      } catch (error) {
        console.error('Polling failed:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, router]);

  // Simulate system logs (in production, this would come from a WebSocket or SSE)
  useEffect(() => {
    const addLog = (level: LogEntry['level'], message: string, context?: string) => {
      setSystemLogs(prev => [...prev.slice(-99), {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level,
        message,
        context
      }]);
    };

    addLog('info', 'Admin control panel initialized');
    
    const interval = setInterval(() => {
      const messages = [
        { level: 'info' as const, msg: 'Webhook processed successfully', ctx: 'EasyPaisa' },
        { level: 'info' as const, msg: 'AI request completed', ctx: `${currentProvider} provider` },
        { level: 'warn' as const, msg: 'High latency detected', ctx: 'Database connection' },
      ];
      const random = messages[Math.floor(Math.random() * messages.length)];
      addLog(random.level, random.msg, random.ctx);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentProvider]);

  // Handler functions
  const handleUserUpdate = async (userId: string, field: keyof UserRecord['subscription'], value: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: { [field]: value } })
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, subscription: { ...u.subscription, [field]: value } } : u
      ));
      
      setSystemLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level: 'info',
        message: `User subscription updated`,
        context: `User: ${userId}, Field: ${field}, Value: ${value}`
      }]);
    } catch (error) {
      throw error;
    }
  };

  const handleCourseUpdate = async (courseId: string, field: 'workflow_status', value: CourseRecord['workflow_status']) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      setCourses(prev => prev.map(c => 
        c._id === courseId ? { ...c, [field]: value } : c
      ));
      
      setSystemLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level: 'info',
        message: `Course workflow updated`,
        context: `Course: ${courseId}, Status: ${value}`
      }]);
    } catch (error) {
      throw error;
    }
  };

  const handleProviderChange = async (provider: 'gemini' | 'openai' | 'auto') => {
    try {
      const res = await fetch('/api/admin/config/ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      
      if (!res.ok) throw new Error('Provider switch failed');
      
      setCurrentProvider(provider);
      setSystemLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level: 'info',
        message: `AI provider switched to ${provider}`,
        context: 'Global configuration'
      }]);
    } catch (error) {
      setSystemLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level: 'error',
        message: 'Failed to switch AI provider',
        context: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading admin control board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Administrative Control Board</h1>
            <p className="text-gray-400 text-sm">Manage users, courses, and system configuration</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-400">Active Provider</div>
              <div className="text-sm font-semibold text-purple-300 capitalize">{currentProvider}</div>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-right">
              <div className="text-xs text-gray-400">Webhook Success</div>
              <div className="text-sm font-semibold text-green-300">{(metrics.webhook_success_rate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column: Data Matrix */}
          <div className="space-y-6">
            <DenseDataMatrix
              users={users}
              courses={courses}
              onUserUpdate={handleUserUpdate}
              onCourseUpdate={handleCourseUpdate}
            />
          </div>

          {/* Right Column: Pipeline & Controls */}
          <div className="space-y-6">
            <WebhookPipeline
              logs={webhookLogs}
              metrics={metrics}
              providerFilter={providerFilter}
              onFilterChange={setProviderFilter}
            />
            <ReasoningEngineControl
              currentProvider={currentProvider}
              onProviderChange={handleProviderChange}
              logs={systemLogs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
