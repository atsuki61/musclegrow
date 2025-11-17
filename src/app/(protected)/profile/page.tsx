import { ProfilePage } from "@/components/features/profile";
import { getProfileData } from "@/lib/actions/profile";

export default async function Page() {
  const profileResult = await getProfileData();

  return (
    <ProfilePage
      initialProfile={profileResult.success ? profileResult.data ?? null : null}
    />
  );
}

