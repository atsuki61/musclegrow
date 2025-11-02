interface TotalDaysBadgeProps {
  days: number;
}

export function TotalDaysBadge({ days }: TotalDaysBadgeProps) {
  return (
    <div className="text-center py-2">
      <p className="text-sm text-muted-foreground">
        合計 <span className="font-semibold text-foreground">{days}</span>日！💪
      </p>
    </div>
  );
}
