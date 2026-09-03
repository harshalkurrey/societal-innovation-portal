import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Tag, User, Users, Plus, Trash2, CheckCircle2, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Problem, TeamMember, Profile, MemberRole } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export function UniversityProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [citizen, setCitizen] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('student');
  const [newDept, setNewDept] = useState('');
  const [adding, setAdding] = useState(false);

  const isAssignedToMe = problem?.assigned_university_id === profile?.id;
  const isAvailable = problem?.status === 'submitted';

  const loadProblem = async () => {
    if (!id) return;
    const { data: prob } = await supabase
      .from('problems')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    setProblem(prob as Problem | null);

    if (prob?.submitted_by) {
      const { data: cit } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', prob.submitted_by)
        .maybeSingle();
      setCitizen(cit as Profile | null);
    }

    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('problem_id', id);
    setTeamMembers((members ?? []) as TeamMember[]);

    setLoading(false);
  };

  useEffect(() => {
    loadProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAccept = async () => {
    if (!problem || !profile) return;
    const { error } = await supabase
      .from('problems')
      .update({
        assigned_university_id: profile.id,
        status: 'assigned',
      })
      .eq('id', problem.id);
    if (!error) {
      await supabase.from('status_history').insert({
        problem_id: problem.id,
        from_status: 'submitted',
        to_status: 'assigned',
        changed_by: profile.id,
        notes: 'Accepted by university',
      });
      loadProblem();
    }
  };

  const handleStatusChange = async (newStatus: Problem['status']) => {
    if (!problem || !profile) return;
    const { error } = await supabase
      .from('problems')
      .update({ status: newStatus })
      .eq('id', problem.id);
    if (!error) {
      await supabase.from('status_history').insert({
        problem_id: problem.id,
        from_status: problem.status,
        to_status: newStatus,
        changed_by: profile.id,
      });
      loadProblem();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newName.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('team_members').insert({
      problem_id: id,
      name: newName,
      member_role: newRole,
      department: newDept || null,
    });
    setAdding(false);
    if (!error) {
      setNewName('');
      setNewDept('');
      setNewRole('student');
      setShowAddMember(false);
      loadProblem();
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    await supabase.from('team_members').delete().eq('id', memberId);
    loadProblem();
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading...</div>;
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Problem not found.</p>
        <Link to="/university/browse" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
          Back to browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => navigate('/university/browse')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Back to browse
      </button>

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
            <InfoRow icon={MapPin} label="Location" value={problem.location || 'N/A'} />
            <InfoRow icon={Calendar} label="Submitted" value={new Date(problem.created_at).toLocaleDateString()} />
            <InfoRow icon={User} label="Priority" value={problem.priority.charAt(0).toUpperCase() + problem.priority.slice(1)} />
          </div>
          {citizen && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1">Submitted by</p>
              <p className="text-sm font-medium text-slate-700">{citizen.name}</p>
            </div>
          )}
        </div>
      </div>

      {isAvailable && (
        <button
          onClick={handleAccept}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
        >
          <CheckCircle2 size={18} /> Accept This Problem
        </button>
      )}

      {isAssignedToMe && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Update Status</label>
            <div className="flex flex-wrap gap-2">
              {(['assigned', 'in_progress', 'resolved'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={problem.status === s}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    problem.status === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAssignedToMe && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-900">Project Team</h2>
            </div>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} /> Add Member
            </button>
          </div>

          {showAddMember && (
            <form onSubmit={handleAddMember} className="mb-4 p-4 rounded-xl bg-slate-50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white"
                  placeholder="Member name"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as MemberRole)}
                  className="px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white"
                placeholder="Department (optional)"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {teamMembers.length === 0 ? (
            <p className="text-sm text-slate-400">No team members yet. Add faculty and students to form your project team.</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
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
                  <button
                    onClick={() => handleDeleteMember(m.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isAssignedToMe && !isAvailable && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center text-sm text-slate-500">
          <FolderOpen className="mx-auto text-slate-300 mb-2" size={28} />
          This problem has been accepted by another university.
        </div>
      )}
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
