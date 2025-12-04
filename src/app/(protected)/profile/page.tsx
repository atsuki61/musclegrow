import { ProfilePage } from "@/components/features/profile";
import { getProfileData } from "@/lib/actions/profile";
import { getAuthSession } from "@/lib/auth-session-server";

export default async function Page() {
  const session = await getAuthSession();
  const user = session?.user ?? null;

  let profile = null;
  if (user) {
    const profileResult = await getProfileData(user.id);
    profile = profileResult.success ? profileResult.data ?? null : null;
  }

  return <ProfilePage initialProfile={profile} user={user} />;
}
