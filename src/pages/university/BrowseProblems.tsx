import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Problem } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function BrowseProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

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

  const filtered = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Browse Problems</h1>
        <p className="text-slate-500 mt-0.5">Find and accept societal problems to work on</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm bg-white"
            placeholder="Search problems..."
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          No problems found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/university/problems/${p.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {p.photo_url && (
                <img src={p.photo_url} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-slate-900">{p.title}</h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded-full bg-slate-100">{p.category}</span>
                {p.location && <span>· {p.location}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
