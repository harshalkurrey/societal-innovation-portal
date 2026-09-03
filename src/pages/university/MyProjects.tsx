import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Problem } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function MyProjects() {
  const { profile } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('problems')
        .select('*')
        .eq('assigned_university_id', profile.id)
        .order('created_at', { ascending: false });
      setProblems((data ?? []) as Problem[]);
      setLoading(false);
    })();
  }, [profile]);

  const filtered = problems.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <p className="text-slate-500 mt-0.5">Problems your university has accepted</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm bg-white"
          placeholder="Search projects..."
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">You haven't accepted any problems yet.</p>
          <Link to="/university/browse" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block font-medium">
            Browse available problems
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/university/problems/${p.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-medium text-slate-900">{p.title}</h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span>{p.category}</span>
                {p.location && <span>· {p.location}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
