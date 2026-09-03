import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Tag, User, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Problem, TeamMember, Profile } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [university, setUniversity] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: prob } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setProblem(prob as Problem | null);

      if (prob?.assigned_university_id) {
        const { data: uni } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', prob.assigned_university_id)
          .maybeSingle();
        setUniversity(uni as Profile | null);
      }

      const { data: members } = await supabase
        .from('team_members')
        .select('*')
        .eq('problem_id', id);
      setTeamMembers((members ?? []) as TeamMember[]);

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading...</div>;
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Problem not found.</p>
        <Link to="/citizen/problems" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
          Back to my problems
        </Link>
      </div>
    );
  }

  const isOwner = profile?.id === problem.submitted_by;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        to="/citizen/problems"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Back to my problems
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {problem.photo_url && (
          <img src={problem.photo_url} alt={problem.title} className="w-full h-56 object-cover" />
        )}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{problem.title}</h1>
            <StatusBadge status={problem.status} />
          </div>

          <p className="text-slate-600 leading-relaxed">{problem.description}</p>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <InfoRow icon={Tag} label="Category" value={problem.category} />
            <InfoRow icon={MapPin} label="Location" value={problem.location || 'Not specified'} />
            <InfoRow icon={Calendar} label="Submitted" value={new Date(problem.created_at).toLocaleDateString()} />
            <InfoRow icon={User} label="Priority" value={problem.priority.charAt(0).toUpperCase() + problem.priority.slice(1)} />
          </div>
        </div>
      </div>

      {university && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Assigned University</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
              {university.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-slate-900">{university.name}</p>
              {university.institution_name && (
                <p className="text-sm text-slate-500">{university.institution_name}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">Project Team</h2>
        </div>
        {teamMembers.length === 0 ? (
          <p className="text-sm text-slate-400">
            {isOwner ? 'No team has been formed yet. A university will assign a team once they accept this problem.' : 'No team members yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {m.member_role === 'faculty' ? 'Faculty' : 'Student'}
                    {m.department ? ` · ${m.department}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Icon size={16} className="text-slate-400" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}
