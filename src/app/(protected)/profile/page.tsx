import { ProfilePage } from "@/components/features/profile";
import { getProfileData } from "@/lib/actions/profile";
import { getAuthUserId } from "@/lib/auth-session-server";

export default async function Page() {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("認証が必要です");
  }

  const profileResult = await getProfileData(userId);

  return (
    <ProfilePage
      initialProfile={profileResult.success ? profileResult.data ?? null : null}
    />
  );
}
