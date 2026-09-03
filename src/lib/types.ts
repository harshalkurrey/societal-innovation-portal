export type Role = 'citizen' | 'university' | 'admin';

export type ProblemStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

export type Priority = 'low' | 'medium' | 'high';

export type MemberRole = 'faculty' | 'student';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  institution_name: string | null;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  district: string | null;
  photo_url: string | null;
  status: ProblemStatus;
  priority: Priority;
  submitted_by: string;
  assigned_university_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  problem_id: string;
  name: string;
  member_role: MemberRole;
  department: string | null;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  problem_id: string;
  from_status: ProblemStatus | null;
  to_status: ProblemStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
}

export const CATEGORIES = [
  'Sanitation',
  'Water',
  'Education',
  'Healthcare',
  'Infrastructure',
  'Environment',
  'Safety',
  'Agriculture',
  'Energy',
  'Other',
] as const;

export const STATUSES: ProblemStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved'];

export const STATUS_LABELS: Record<ProblemStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export const STATUS_COLORS: Record<ProblemStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700 border-slate-200',
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
