import { HomePage } from "@/components/features/home";
import { AuthGuard } from "@/lib/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}
