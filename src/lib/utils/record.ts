export const MAX_SETS = 50;

export function hasAnyPositiveInputValue(set: {
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
}): boolean {
  const weight = Number(set.weight ?? 0);
  const reps = Number(set.reps ?? 0);
  const duration = Number(set.duration ?? 0);

  const hasWeight = Number.isFinite(weight) && weight > 0;
  const hasReps = Number.isFinite(reps) && reps > 0;
  const hasDuration = Number.isFinite(duration) && duration > 0;

  return hasWeight || hasReps || hasDuration;
}
