import { ProfilePage } from "@/components/features/profile";
import { getProfileData } from "@/lib/actions/profile";
import { getAuthSession } from "@/lib/auth-session-server";
import { redirect } from "next/navigation";

export default async function Page() {
  // 修正: userIdだけでなく、session全体を取得してユーザー情報(name, image)を取り出す
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  const profileResult = await getProfileData(session.user.id);

  return (
    <ProfilePage
      initialProfile={profileResult.success ? profileResult.data ?? null : null}
      // 追加: ユーザー情報を渡す
      user={session.user}
    />
  );
}
