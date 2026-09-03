import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Loader, CheckCircle2, BarChart3, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Problem } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function AdminDashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: false });
      setProblems((data ?? []) as Problem[]);
      setLoading(false);
    })();
  }, []);

  const stats = {
    total: problems.length,
    pending: problems.filter((p) => p.status === 'submitted').length,
    inProgress: problems.filter((p) => p.status === 'assigned' || p.status === 'in_progress').length,
    resolved: problems.filter((p) => p.status === 'resolved').length,
  };

  const categoryCounts = problems.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...sortedCategories.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-0.5">Platform-wide overview of all societal problems</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Problems" value={stats.total} color="text-blue-600 bg-blue-50" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-amber-600 bg-amber-50" />
        <StatCard icon={Loader} label="In Progress" value={stats.inProgress} color="text-indigo-600 bg-indigo-50" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">Problems by Category</h2>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : sortedCategories.length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{cat}</span>
                    <span className="text-sm text-slate-500">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Problems</h2>
            <Link to="/admin/problems" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : problems.length === 0 ? (
            <p className="text-sm text-slate-400">No problems submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {problems.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.category}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
