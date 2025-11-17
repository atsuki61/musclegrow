import type { CardioRecord, SetRecord } from "@/types/workout";

export interface SessionDetails {
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
  date: Date;
  durationMinutes?: number | null;
  note?: string | null;
}

export type SerializedSessionDetails = Omit<SessionDetails, "date"> & {
  date: string;
};

export function serializeSessionDetails(
  details: SessionDetails
): SerializedSessionDetails {
  return {
    ...details,
    date: details.date.toISOString(),
  };
}

export function deserializeSessionDetails(
  details: SerializedSessionDetails
): SessionDetails {
  return {
    ...details,
    date: new Date(details.date),
  };
}

