import { Link } from 'react-router-dom';
import { PlusCircle, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Problem } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function CitizenDashboard() {
  const { profile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('problems')
        .select('*')
        .eq('submitted_by', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setProblems((data ?? []) as Problem[]);
      setLoading(false);
    })();
  }, [profile]);

  const stats = {
    total: problems.length,
    resolved: problems.filter((p) => p.status === 'resolved').length,
    inProgress: problems.filter((p) => p.status === 'in_progress' || p.status === 'assigned').length,
    pending: problems.filter((p) => p.status === 'submitted').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.name}</h1>
          <p className="text-slate-500 mt-0.5">Report and track societal problems in your community</p>
        </div>
        <Link
          to="/citizen/submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
        >
          <PlusCircle size={18} /> Submit New Problem
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Problems" value={stats.total} color="text-blue-600 bg-blue-50" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-amber-600 bg-amber-50" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="text-indigo-600 bg-indigo-50" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="text-emerald-600 bg-emerald-50" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent Problems</h2>
          <Link to="/citizen/problems" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            Loading...
          </div>
        ) : problems.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">You haven't submitted any problems yet.</p>
            <Link
              to="/citizen/submit"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <PlusCircle size={16} /> Submit your first problem
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((p) => (
              <Link
                key={p.id}
                to={`/citizen/problems/${p.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{p.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {p.category} {p.location ? `· ${p.location}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
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
