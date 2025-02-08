import { auth } from "@/auth";
import { SignIn } from "@/components/auth/signin-button";
import { SignOut } from "@/components/auth/signout-button";

export default async function Home() {
	const session = await auth();
	if (session) {
		return (
			<div>
				You are signed in
				<SignOut />
			</div>
		);
	}
	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<SignIn />
		</div>
	);
}
