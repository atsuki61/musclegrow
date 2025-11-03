import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * 記録ページへの遷移ボタンコンポーネント
 * ホームページで使用される、おしゃれなスタイルの記録ボタン
 */
export function RecordButton() {
  return (
    <div className="flex justify-center">
      <Button
        asChild
        size="lg"
        className="group w-full max-w-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
      >
        <Link href="/record" className="flex items-center gap-2.5">
          <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
          <span className="font-semibold">記録する</span>
        </Link>
      </Button>
    </div>
  );
}
