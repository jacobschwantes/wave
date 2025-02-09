import { auth } from "@/auth";
import { SignIn } from "@/components/auth/signin-button";
import { SignOut } from "@/components/auth/signout-button";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <main className="wave-bg min-h-screen relative">
      <div className="wave-container absolute inset-0">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="floating text-center">
          {session ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
              Welcome back!
              <Link href="/home">Home</Link>
              <div className="mt-4">
                <SignOut />
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <SignIn />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
