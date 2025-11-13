import { ProfilePage } from "@/components/features/profile";
import { AuthGuard } from "@/lib/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}
