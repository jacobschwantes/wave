import { auth } from "@/auth";
import { SignIn } from "@/components/auth/signin";
import { SignOut } from "@/components/auth/signout-button";
import Link from "next/link";

export default async function Home() {
	const session = await auth();

	return (
		<main className="min-h-screen relative">
			<div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
				<div className="floating text-center">
					{session ? (
						<div>
							<Link
								href="/home"
								className="px-6 py-4 border border-gray-200 rounded-lg"
							>
								enter
							</Link>
						</div>
					) : (
						<div className="backdrop-blur-lg rounded-lg p-6">
							<SignIn />
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
