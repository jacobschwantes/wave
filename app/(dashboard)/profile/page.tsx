import { auth } from "@/auth";
import ProfileLocation from "@/components/location/ProfileLocation";
import { SignOut } from "@/components/auth/signout-button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Location</h2>
          <ProfileLocation userId={session.user.id} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <SignOut />
        </div>
      </div>
    </div>
  );
}
