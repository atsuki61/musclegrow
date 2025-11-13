import { HistoryPage } from "@/components/features/history";
import { AuthGuard } from "@/lib/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <HistoryPage />
    </AuthGuard>
  );
}
