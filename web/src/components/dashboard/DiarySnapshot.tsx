import { Skeleton } from '@/components/ui';
import type { DiarySnapshot as DiarySnapshotData } from '@/lib/types';

export function DiarySnapshot({
  snapshot,
  isLoading,
}: {
  snapshot: DiarySnapshotData | null;
  isLoading: boolean;
}) {
  const showSkeleton = isLoading && snapshot == null;
  const streakLabel = snapshot == null ? '' : snapshot.streakDays === 1 ? 'day in a row' : 'days in a row';

  const streakHint =
    snapshot == null
      ? 'Streak shows up with today’s meals.'
      : snapshot.loggedToday
        ? 'Logged today.'
        : snapshot.streakDays > 0
          ? 'Log a meal today to keep it.'
          : 'Log a meal to start one.';

  const weekValue =
    snapshot == null || snapshot.daysScored === 0
      ? null
      : `${snapshot.daysOnTarget} of ${snapshot.daysScored}`;

  const weekHint =
    snapshot != null && snapshot.daysScored > 0
      ? 'logged days within 10% of that day’s goal'
      : 'A logged day counts when it lands within 10% of the goal.';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <article
        data-today="stat"
        className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgb(17_17_19/0.04)]"
      >
        <p className="text-xs text-muted">Streak</p>
        {showSkeleton ? (
          <Skeleton className="mt-2 h-9 w-16" />
        ) : (
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
            {snapshot?.streakDays ?? '—'}
            {snapshot != null && (
              <span className="ml-2 text-base font-medium text-subtle">{streakLabel}</span>
            )}
          </p>
        )}
        <p className="mt-2 text-sm text-muted">{showSkeleton ? 'Checking the last meals.' : streakHint}</p>
      </article>

      <article
        data-today="stat"
        className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-[0_1px_2px_rgb(17_17_19/0.04)]"
      >
        <p className="text-xs text-muted">On target this week</p>
        {showSkeleton ? (
          <Skeleton className="mt-2 h-9 w-24" />
        ) : (
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
            {weekValue ?? '—'}
          </p>
        )}
        <p className="mt-2 text-sm text-muted">{weekHint}</p>
      </article>
    </div>
  );
}
