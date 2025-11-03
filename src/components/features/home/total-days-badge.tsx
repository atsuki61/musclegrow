import { Badge } from "@/components/ui/badge";

interface TotalDaysBadgeProps {
  days: number;
}

export function TotalDaysBadge({ days }: TotalDaysBadgeProps) {
  return (
    <div className="flex justify-center py-4">
      <Badge variant="secondary" className="text-base px-4 py-2">
        <span className="text-muted-foreground">合計</span>
        <span className="font-bold text-foreground mx-1">{days}</span>
        <span className="text-muted-foreground">日</span>
      </Badge>
    </div>
  );
}
