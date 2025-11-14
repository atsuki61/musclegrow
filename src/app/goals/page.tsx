import { AuthGuard } from "@/lib/auth-guard";
import { GoalsPage } from "@/components/features/goals";

export default function Page() {
  return (
    <AuthGuard>
      <GoalsPage />
    </AuthGuard>
  );
}

