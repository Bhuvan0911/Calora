/** Calories count as on target when they sit within this share of that day's goal. */
export const ON_TARGET_BAND = 0.1;

export interface DiaryDay {
  date: string;
  calories: number;
  entryCount: number;
  goalCalories: number | null;
}

export interface DiarySnapshot {
  /** Consecutive logged days ending today, or yesterday if today is still empty. */
  streakDays: number;
  loggedToday: boolean;
  /** Logged days in the window whose calories are within 10% of that day's goal. */
  daysOnTarget: number;
  /** Logged days in the window that had a calorie goal. */
  daysScored: number;
  windowDays: number;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isOnTarget(day: DiaryDay): boolean {
  if (day.goalCalories == null || day.goalCalories <= 0) {
    return false;
  }

  return Math.abs(day.calories - day.goalCalories) / day.goalCalories <= ON_TARGET_BAND;
}

/**
 * Streak walks backward from the eater's local day. An empty today does not
 * break a streak that was alive yesterday, so morning-before-breakfast stays fair.
 * Days outside `days` count as not logged.
 */
export function summarizeDiary(days: DiaryDay[], today: string, windowDays = 7): DiarySnapshot {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const loggedToday = (byDate.get(today)?.entryCount ?? 0) > 0;

  let cursor = loggedToday ? today : shiftDateKey(today, -1);
  let streakDays = 0;

  for (let step = 0; step < 366; step += 1) {
    const row = byDate.get(cursor);
    if (!row || row.entryCount <= 0) {
      break;
    }

    streakDays += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  let daysOnTarget = 0;
  let daysScored = 0;

  for (let offset = 0; offset < windowDays; offset += 1) {
    const row = byDate.get(shiftDateKey(today, -offset));
    if (!row || row.entryCount <= 0 || row.goalCalories == null || row.goalCalories <= 0) {
      continue;
    }

    daysScored += 1;
    if (isOnTarget(row)) {
      daysOnTarget += 1;
    }
  }

  return { streakDays, loggedToday, daysOnTarget, daysScored, windowDays };
}
