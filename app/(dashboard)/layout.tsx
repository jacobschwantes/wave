import { auth } from "@/auth";
import Header from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const isOnboarding = false;
	const session = await auth();
	if (!session) {
		return redirect("/");
	}
	return (
		<div className="min-h-screen flex flex-col w-full">
			{isOnboarding ? (
				<Onboarding name={session?.user?.name} />
			) : (
				<>
					<Header />
					{children}
				</>
			)}
		</div>
	);
}

async function Onboarding({ name }: { name: string | null | undefined }) {
	return (
		<div className="flex flex-col items-center h-screen gap-24">
			<div className="flex flex-col items-center justify-center gap-6">
				<h1 className="text-4xl font-bold">
					Hello {name}, where are you from?
				</h1>
				<Input placeholder="Minneapolis, MN" />
			</div>
			<div className="flex flex-col items-center justify-center gap-6">
				<h1 className="text-4xl font-bold">What are your top 3 tracks?</h1>
				<Input placeholder="track 1" />
				<Input placeholder="track 2" />
				<Input placeholder="track 3" />
			</div>
		</div>
	);
}
