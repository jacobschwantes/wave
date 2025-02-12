import { auth } from "@/auth";
import { SignIn } from "@/components/auth/signin";
import { redirect } from "next/navigation";

export default async function Home() {
	const session = await auth();
	
	if (session) {
		redirect("/home");
	}

	return (
		<main className="min-h-screen relative">
			<div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
				<div className="floating text-center">
					<div className="backdrop-blur-lg rounded-lg p-6">
						<SignIn />
					</div>
				</div>
			</div>
		</main>
	);
}
