import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { summarizeDiary, type DiaryDay } from './diarySummary.js';

const day = (
  date: string,
  entryCount: number,
  calories: number,
  goalCalories: number | null,
): DiaryDay => ({ date, entryCount, calories, goalCalories });

describe('diary snapshot', () => {
  it('keeps yesterday’s streak when today has no meal yet', () => {
    const snapshot = summarizeDiary(
      [
        day('2026-10-24', 1, 2000, 2000),
        day('2026-10-25', 2, 1900, 2000),
        day('2026-10-26', 0, 0, 2000),
      ],
      '2026-10-26',
    );

    assert.equal(snapshot.loggedToday, false);
    assert.equal(snapshot.streakDays, 2);
  });

  it('counts today and stops at the first empty day', () => {
    const snapshot = summarizeDiary(
      [
        day('2026-10-23', 0, 0, 2000),
        day('2026-10-24', 1, 2100, 2000),
        day('2026-10-25', 1, 1800, 2000),
        day('2026-10-26', 1, 2050, 2000),
      ],
      '2026-10-26',
    );

    assert.equal(snapshot.loggedToday, true);
    assert.equal(snapshot.streakDays, 3);
  });

  it('drops the streak when both today and yesterday are empty', () => {
    const snapshot = summarizeDiary(
      [day('2026-10-24', 3, 2000, 2000), day('2026-10-25', 0, 0, 2000), day('2026-10-26', 0, 0, 2000)],
      '2026-10-26',
    );

    assert.equal(snapshot.streakDays, 0);
  });

  it('scores only logged days, and only when calories are within 10%', () => {
    const snapshot = summarizeDiary(
      [
        day('2026-10-24', 1, 1800, 2000),
        day('2026-10-25', 1, 1799, 2000),
        day('2026-10-26', 0, 0, 2000),
        day('2026-10-23', 1, 2000, null),
      ],
      '2026-10-26',
      7,
    );

    assert.equal(snapshot.daysScored, 2);
    assert.equal(snapshot.daysOnTarget, 1);
    assert.equal(snapshot.windowDays, 7);
  });
});
