import { StatsPage } from "@/components/features/stats";
import { AuthGuard } from "@/lib/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <StatsPage />
    </AuthGuard>
  );
}
