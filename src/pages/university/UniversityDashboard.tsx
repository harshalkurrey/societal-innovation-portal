import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Problem } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function UniversityDashboard() {
  const { profile } = useAuth();
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [myProblems, setMyProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: allData }, { data: myData }] = await Promise.all([
        supabase.from('problems').select('*').order('created_at', { ascending: false }),
        supabase
          .from('problems')
          .select('*')
          .eq('assigned_university_id', profile?.id ?? '')
          .order('created_at', { ascending: false }),
      ]);
      setAllProblems((allData ?? []) as Problem[]);
      setMyProblems((myData ?? []) as Problem[]);
      setLoading(false);
    })();
  }, [profile]);

  const stats = {
    available: allProblems.filter((p) => p.status === 'submitted').length,
    assigned: myProblems.filter((p) => p.status === 'assigned').length,
    inProgress: myProblems.filter((p) => p.status === 'in_progress').length,
    resolved: myProblems.filter((p) => p.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">University Dashboard</h1>
        <p className="text-slate-500 mt-0.5">
          {profile?.institution_name || profile?.name} — Browse and adopt societal problems
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Available" value={stats.available} color="text-blue-600 bg-blue-50" />
        <StatCard icon={Clock} label="Assigned" value={stats.assigned} color="text-indigo-600 bg-indigo-50" />
        <StatCard icon={FolderOpen} label="In Progress" value={stats.inProgress} color="text-amber-600 bg-amber-50" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Available Problems</h2>
            <Link to="/university/browse" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Browse all
            </Link>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Loading...</div>
          ) : allProblems.filter((p) => p.status === 'submitted').length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
              No available problems right now.
            </div>
          ) : (
            <div className="space-y-3">
              {allProblems
                .filter((p) => p.status === 'submitted')
                .slice(0, 4)
                .map((p) => (
                  <Link
                    key={p.id}
                    to={`/university/problems/${p.id}`}
                    className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-medium text-slate-900 truncate">{p.title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {p.category} {p.location ? `· ${p.location}` : ''}
                    </p>
                  </Link>
                ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">My Projects</h2>
            <Link to="/university/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Loading...</div>
          ) : myProblems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
              You haven't accepted any problems yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myProblems.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to={`/university/problems/${p.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-slate-900 truncate">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof ClipboardList; label: string; value: number; color: string }) {
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
