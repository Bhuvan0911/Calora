'use client';

import type { ReactNode } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatCalories, formatGrams } from '@/lib/format';
import type { GoalComparison } from '@/lib/types';

const AXIS_STYLE = { fill: 'var(--subtle)', fontSize: 13 };

const LOGGED_COLOR = 'var(--accent)';
const TARGET_COLOR = 'var(--fat)';
const WEB_STROKE = '#b4b4ba';

const TOOLTIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: '0 4px 16px rgb(17 17 19 / 0.08)',
};

interface MetricRow {
  label: string;
  logged: number;
  goal: number;
  percent: number;
  axisMax: number;
  actualText: string;
  targetText: string;
}

interface RadarDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: MetricRow;
  points?: ReadonlyArray<{ cx?: number; cy?: number }>;
}

function metricRow(
  label: string,
  percent: number,
  actualText: string,
  targetText: string,
): Omit<MetricRow, 'axisMax'> {
  return { label, logged: percent, goal: 100, percent, actualText, targetText };
}

function metricsFrom(
  comparison: GoalComparison,
  adherence: NonNullable<GoalComparison['adherence']>,
): MetricRow[] {
  const overall = Math.round(
    (adherence.calories + adherence.proteinGrams + adherence.fatGrams + adherence.carbGrams) / 4,
  );

  const rows = [
    metricRow(
      'Calories',
      adherence.calories,
      `${formatCalories(comparison.actual.calories)} kcal`,
      `${formatCalories(comparison.target.calories)} kcal`,
    ),
    metricRow(
      'Protein',
      adherence.proteinGrams,
      `${formatGrams(comparison.actual.proteinGrams)} g`,
      `${formatGrams(comparison.target.proteinGrams)} g`,
    ),
    metricRow(
      'Fat',
      adherence.fatGrams,
      `${formatGrams(comparison.actual.fatGrams)} g`,
      `${formatGrams(comparison.target.fatGrams)} g`,
    ),
    metricRow(
      'Carbs',
      adherence.carbGrams,
      `${formatGrams(comparison.actual.carbGrams)} g`,
      `${formatGrams(comparison.target.carbGrams)} g`,
    ),
    metricRow('Goal vs actual', overall, `${overall}% consumed`, '100%'),
  ];

  const axisMax = chartMax(rows.map((row) => row.percent));
  return rows.map((row) => ({
    ...row,
    axisMax,
    logged: Math.min(row.percent, axisMax),
  }));
}

/** 100 is complete. The web never stretches past 200%, so the goal pentagon stays readable. */
function chartMax(percents: number[]): number {
  const peak = Math.max(100, ...percents);
  if (peak <= 100) return 100;
  const padded = Math.min(peak * 1.06, 200);
  const steps = [120, 150, 200];
  return steps.find((step) => step >= padded) ?? 200;
}

function radiusTicks(max: number): number[] {
  if (max <= 100) {
    return [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  }

  const ticks = new Set<number>([100, max]);
  const step = max / 10;
  for (let i = 1; i <= 10; i += 1) {
    ticks.add(Math.round(i * step));
  }
  return [...ticks].filter((tick) => tick > 0 && tick <= max).sort((a, b) => a - b);
}

function labelTick(value: number, max: number): string {
  if (value === 100 || value === max) {
    return String(value);
  }
  if (max <= 100) {
    return value % 20 === 0 ? String(value) : '';
  }
  const step = max <= 200 ? 50 : max <= 400 ? 100 : 200;
  return value % step === 0 ? String(value) : '';
}

function formatVertexPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

function polarOrigin(points: RadarDotProps['points'], index: number, fallbackX: number, fallbackY: number) {
  const origin = points?.[index];
  return {
    x: origin?.cx ?? fallbackX,
    y: origin?.cy ?? fallbackY,
  };
}

function alongSpoke(originX: number, originY: number, x: number, y: number, radius: number) {
  const dx = x - originX;
  const dy = y - originY;
  const len = Math.hypot(dx, dy) || 1;
  return { x: originX + (dx / len) * radius, y: originY + (dy / len) * radius };
}

function besideSpoke(originX: number, originY: number, x: number, y: number, distance: number) {
  const dx = x - originX;
  const dy = y - originY;
  const len = Math.hypot(dx, dy) || 1;
  return { x: x - (dy / len) * distance, y: y + (dx / len) * distance };
}

function chartOuterPx(vertexR: number, value: number, axisMax: number): number {
  if (value <= 0) {
    return vertexR + 48;
  }
  return (vertexR / value) * axisMax;
}

function VertexHaloText({
  x,
  y,
  className,
  fontSize,
  children,
}: {
  x: number;
  y: number;
  className: string;
  fontSize: number;
  children: ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={fontSize}
      className={`${className} tabular-nums`}
      fill="var(--foreground)"
      stroke="rgba(255,255,255,0.94)"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {children}
    </text>
  );
}

function TargetDot(props: unknown) {
  if (!props || typeof props !== 'object') {
    return null;
  }

  const { cx, cy, index = 0, payload, points } = props as RadarDotProps;
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload?.targetText) {
    return null;
  }

  const origin = polarOrigin(points, index, cx, cy);
  const vertexR = Math.hypot(cx - origin.x, cy - origin.y);
  const along =
    vertexR < 56
      ? alongSpoke(origin.x, origin.y, cx, cy, 52)
      : alongSpoke(origin.x, origin.y, cx, cy, Math.max(vertexR - 14, 22));
  const { x, y } = besideSpoke(origin.x, origin.y, along.x, along.y, 12);

  return (
    <g>
      <circle cx={cx} cy={cy} r={2.5} fill={TARGET_COLOR} />
      <VertexHaloText x={x} y={y} className="spider-target-label" fontSize={10}>
        <tspan fill="var(--muted)">{payload.targetText}</tspan>
      </VertexHaloText>
    </g>
  );
}

function LoggedDot(props: unknown) {
  if (!props || typeof props !== 'object') {
    return null;
  }

  const { cx, cy, index = 0, payload, points } = props as RadarDotProps;
  if (typeof cx !== 'number' || typeof cy !== 'number' || typeof payload?.percent !== 'number') {
    return null;
  }

  const origin = polarOrigin(points, index, cx, cy);
  const vertexR = Math.hypot(cx - origin.x, cy - origin.y);
  const outer = chartOuterPx(vertexR, payload.logged, payload.axisMax);
  const nearRim = vertexR > outer * 0.82;
  const labelR = nearRim
    ? Math.max(vertexR - 22, outer * 0.62)
    : Math.min(Math.max(vertexR + 18, 28), Math.max(outer - 22, vertexR + 8));
  const { x, y } = alongSpoke(origin.x, origin.y, cx, cy, labelR);
  const showAmount = payload.label !== 'Goal vs actual';

  return (
    <g>
      <circle cx={cx} cy={cy} r={3.5} fill={LOGGED_COLOR} />
      <VertexHaloText x={x} y={y} className="spider-logged-label" fontSize={11}>
        {showAmount ? <tspan fill="var(--foreground)">{payload.actualText} · </tspan> : null}
        <tspan fill={LOGGED_COLOR} fontWeight={700} className="spider-percent-label">
          {formatVertexPercent(payload.percent)}
        </tspan>
      </VertexHaloText>
    </g>
  );
}

function PercentMeter({ percent }: { percent: number }) {
  const fill = Math.min(Math.max(percent, 0), 100);

  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-border" aria-hidden>
        <span
          className="block h-full rounded-full"
          style={{
            width: `${fill}%`,
            background: percent >= 100 ? 'var(--accent)' : 'var(--foreground)',
          }}
        />
      </span>
      <span className="tabular-nums">
        {percent}%
        {percent >= 100 ? <span className="ml-1.5 font-medium text-subtle">Complete</span> : null}
      </span>
    </span>
  );
}

function readMetric(payload: ReadonlyArray<{ payload?: unknown }> | undefined): MetricRow | undefined {
  const row = payload?.[0]?.payload ?? payload?.[0];
  if (!row || typeof row !== 'object') {
    return undefined;
  }

  const candidate = row as Partial<MetricRow>;
  if (
    typeof candidate.label !== 'string' ||
    typeof candidate.actualText !== 'string' ||
    typeof candidate.targetText !== 'string' ||
    typeof candidate.percent !== 'number'
  ) {
    return undefined;
  }

  return candidate as MetricRow;
}

function GoalTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}) {
  const metric = readMetric(payload);
  if (!active || !metric) {
    return null;
  }

  return (
    <div style={TOOLTIP_STYLE} className="min-w-[12rem] px-3 py-2.5 text-foreground">
      <p className="font-medium">{metric.label}</p>
      <p className="mt-1.5 tabular-nums text-muted">Logged {metric.actualText}</p>
      <p className="tabular-nums text-subtle">Target {metric.targetText}</p>
      {metric.label === 'Goal vs actual' ? (
        <p className="mt-1 text-xs text-subtle">Average of calories, protein, fat and carbs</p>
      ) : null}
      <p className="mt-1.5 font-semibold tabular-nums">
        {metric.percent}% of target
        {metric.percent >= 100 ? ' · Complete' : ''}
      </p>
    </div>
  );
}

export function GoalComparisonChart({ comparison }: { comparison: GoalComparison }) {
  if (!comparison.hasGoal || !comparison.adherence) {
    return (
      <p className="py-12 text-center text-sm text-muted">
        No goal covered this range, so there is nothing to compare against.
      </p>
    );
  }

  const metrics = metricsFrom(comparison, comparison.adherence);
  const max = chartMax(metrics.map((metric) => metric.percent));
  const ticks = radiusTicks(max);
  const hasCappedSpoke = metrics.some((metric) => metric.percent > max);

  return (
    <div className="flex flex-col gap-6">
      <div className="min-w-0">
        <div className="h-[440px] w-full sm:h-[520px] xl:h-[620px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={metrics}
              cx="50%"
              cy="50%"
              outerRadius="78%"
              margin={{ top: 28, right: 36, bottom: 28, left: 36 }}
            >
              <PolarGrid
                stroke={WEB_STROKE}
                strokeWidth={1}
                gridType="polygon"
                radialLines
              />
              <PolarAngleAxis dataKey="label" type="category" tick={AXIS_STYLE} tickLine={false} />
              <PolarRadiusAxis
                type="number"
                domain={[0, max]}
                ticks={ticks}
                tick={{ fill: 'var(--subtle)', fontSize: 11 }}
                tickFormatter={(value) => labelTick(Number(value), max)}
                tickLine={false}
                axisLine={false}
                angle={18}
              />
              <Radar
                name="Target"
                dataKey="goal"
                stroke={TARGET_COLOR}
                fill={TARGET_COLOR}
                fillOpacity={0.12}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={TargetDot}
                isAnimationActive={false}
              />
              <Radar
                name="Logged"
                dataKey="logged"
                stroke={LOGGED_COLOR}
                fill={LOGGED_COLOR}
                fillOpacity={0.22}
                strokeWidth={2}
                dot={LoggedDot}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <GoalTooltip active={active} payload={payload} />
                )}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 20 }}
                isAnimationActive={false}
                shared
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <ul className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: 'var(--accent)', opacity: 0.7 }} />
            Logged · amount and % of target
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px]"
              style={{
                background: 'var(--fat)',
                opacity: 0.7,
                boxShadow: 'inset 0 0 0 1px var(--fat)',
              }}
            />
            Target · goal amount at 100%
          </li>
        </ul>
        <p className="mt-2 text-center text-xs text-subtle">
          Red labels are logged amount and % of target. Gray labels are the goal on the 100% pentagon.
          Outside the gray web means over goal.
          {hasCappedSpoke
            ? ' The web is drawn to 200%; spokes over that sit on the outer ring, and labels still show the true %.'
            : null}
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-subtle">
            <th className="pb-2 font-medium">Metric</th>
            <th className="pb-2 text-right font-medium">Logged</th>
            <th className="pb-2 text-right font-medium">Target</th>
            <th className="pb-2 text-right font-medium">Of target</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.label} className="border-b border-border last:border-0">
              <td className="py-2 text-muted">{metric.label}</td>
              <td className="py-2 text-right tabular-nums">{metric.actualText}</td>
              <td className="py-2 text-right tabular-nums text-subtle">{metric.targetText}</td>
              <td className="py-2 text-right font-semibold">
                <PercentMeter percent={metric.percent} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
