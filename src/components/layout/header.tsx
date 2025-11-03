import { Badge } from "@/components/ui/badge";

export function Header() {
  // ダミーデータ（将来的にはAPIから取得）
  const totalDays = 180;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">MuscleGrow</h1>
          <Badge
            variant="secondary"
            className="rounded-full text-xs px-1.5 py-0.5 font-medium"
          >
            🔥{totalDays}
          </Badge>
        </div>
        <button>⚙️</button>
      </div>
    </header>
  );
}
