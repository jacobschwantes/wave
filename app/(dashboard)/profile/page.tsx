import { auth } from "@/auth";
import ProfileLocation from "@/components/location/ProfileLocation";
import { SignOut } from "@/components/auth/signout-button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-8">Profile</h1>

      <div className="grid gap-8">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="rounded-lg px-4 pb-4">
          <div className="flex flex-col gap-2 pb-4">
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="font-medium">{session.user.name}</p>
          </div>
          <div className="flex flex-col gap-2 pb-4">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold">Location</h2>
        <div className="rounded-lg px-4 pb-4">
          <ProfileLocation userId={session.user.id} />
        </div>

        <h2 className="text-lg font-semibold">Account Actions</h2>
        <div className="px-4 pb-4">
          <SignOut />
        </div>
      </div>
    </div>
  );
}
