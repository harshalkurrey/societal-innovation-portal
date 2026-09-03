import { STATUS_COLORS, STATUS_LABELS, type ProblemStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: ProblemStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
