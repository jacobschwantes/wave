import { auth } from "@/auth";

export default async function ProfilePage() {
	const session = await auth();

	return (
		<div className="flex flex-col">
			<h1 className="text-2xl font-bold">Profile</h1>
			<p className="text-sm text-gray-500">
				Welcome back, {session?.user?.name}!
			</p>
			<p className="text-sm text-gray-500">Email: {session?.user?.email}</p>
		</div>
	);
}
